/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation; either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program.  If not, see
 * <https://www.gnu.org/licenses/>.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { createServer as createHttpsServer } from 'node:https'
import { type AddressInfo, createServer as createTcpServer, type Server, type Socket } from 'node:net'
import { after, describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { classifyJamsRequestError, describeJamsSignInFailure, diagnoseJamsSignInFailure } from './jams.js'

const servers: Server[] = []
const sockets: Socket[] = []

async function listen(server: Server, scheme = 'http'): Promise<string> {
  servers.push(server)
  server.on('connection', (socket: Socket) => sockets.push(socket))
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return `${scheme}://127.0.0.1:${(server.address() as AddressInfo).port}`
}

// A JAMS stand-in: answers each request with the handler, and records it.
function jams(handler: (request: IncomingMessage, response: ServerResponse) => void) {
  const requests: IncomingMessage[] = []
  const url = listen(
    createServer((request, response) => {
      requests.push(request)
      handler(request, response)
    }),
  )
  return { url, requests }
}

after(async () => {
  for (const socket of sockets) {
    socket.destroy()
  }
  await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))))
})

describe('diagnoseJamsSignInFailure', () => {
  it('blames the credentials when JAMS asks for them, without sending any', async () => {
    const server = jams((_request, response) => response.writeHead(401).end())

    assert.deepEqual(await diagnoseJamsSignInFailure(await server.url), { reason: 'credentials' })
    assert.equal(server.requests.length, 1)
    assert.equal(server.requests[0].url, '/api/auth/device')
    assert.equal(server.requests[0].headers.authorization, undefined)
  })

  it('appends the device path to the JAMS URL as given, like the daemon', async () => {
    const server = jams((_request, response) => response.writeHead(401).end())

    await diagnoseJamsSignInFailure(`${await server.url}/jams`)

    assert.equal(server.requests[0].url, '/jams/api/auth/device')
  })

  it('reports a URL where no JAMS answers', async () => {
    const server = jams((_request, response) => response.writeHead(404).end())

    assert.deepEqual(await diagnoseJamsSignInFailure(await server.url), { reason: 'not-jams', detail: 'HTTP 404' })
  })

  it('reports a server that answers without credentials, which JAMS never does', async () => {
    // A web application that serves its page at any path, for instance.
    const server = jams((_request, response) => response.writeHead(200).end('<!doctype html>'))

    assert.deepEqual(await diagnoseJamsSignInFailure(await server.url), { reason: 'not-jams', detail: 'HTTP 200' })
  })

  it('follows 301 and 302 redirections, like the daemon', async () => {
    const server = jams((request, response) => {
      if (request.url === '/api/auth/device') {
        response.writeHead(302, { location: '/moved/api/auth/device' }).end()
      } else {
        response.writeHead(401).end()
      }
    })

    assert.deepEqual(await diagnoseJamsSignInFailure(await server.url), { reason: 'credentials' })
    assert.deepEqual(
      server.requests.map((request) => request.url),
      ['/api/auth/device', '/moved/api/auth/device'],
    )
  })

  it('reports the other redirections, which the daemon does not follow', async () => {
    const server = jams((_request, response) =>
      response.writeHead(308, { location: 'https://jams.example/api/auth/device' }).end(),
    )

    assert.deepEqual(await diagnoseJamsSignInFailure(await server.url), {
      reason: 'not-jams',
      detail: 'HTTP 308, redirection to https://jams.example/api/auth/device',
    })
  })

  it('reports a failing JAMS', async () => {
    const server = jams((_request, response) => response.writeHead(503).end())

    assert.deepEqual(await diagnoseJamsSignInFailure(await server.url), { reason: 'server-error', detail: 'HTTP 503' })
  })

  it('reports a JAMS that refuses connections', async () => {
    const closed = createTcpServer()
    const url = await listen(closed)
    await new Promise((resolve) => closed.close(resolve))

    const failure = await diagnoseJamsSignInFailure(url)

    assert.equal(failure.reason, 'unreachable')
    assert.match('detail' in failure ? failure.detail : '', /ECONNREFUSED/)
  })

  it('reports a JAMS that does not answer', async () => {
    const url = await listen(createTcpServer())

    assert.deepEqual(await diagnoseJamsSignInFailure(url, 200), {
      reason: 'unreachable',
      detail: 'no answer within 0.2 s',
    })
  })
})

describe('diagnoseJamsSignInFailure over HTTPS', () => {
  // Signed by a test CA that no CA store holds (fixtures/jams-tls, valid until 2126).
  const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/jams-tls/${name}`, import.meta.url))
  const testCa = fixture('ca.pem')

  function httpsJams() {
    const server = createHttpsServer(
      { cert: readFileSync(fixture('server.pem')), key: readFileSync(fixture('server.key')) },
      (_request, response) => response.writeHead(401).end(),
    )
    return listen(server, 'https')
  }

  async function withEnvironment(environment: Record<string, string | undefined>, run: () => Promise<void>) {
    const saved = Object.fromEntries(Object.keys(environment).map((name) => [name, process.env[name]]))
    const apply = (values: Record<string, string | undefined>) => {
      for (const [name, value] of Object.entries(values)) {
        if (value === undefined) {
          delete process.env[name]
        } else {
          process.env[name] = value
        }
      }
    }
    apply(environment)
    try {
      await run()
    } finally {
      apply(saved)
    }
  }

  it('trusts the CA certificates the daemon trusts, such as those of SSL_CERT_FILE', async () => {
    const url = await httpsJams()

    await withEnvironment({ SSL_CERT_FILE: testCa, NODE_EXTRA_CA_CERTS: undefined }, async () => {
      assert.deepEqual(await diagnoseJamsSignInFailure(url), { reason: 'credentials' })
    })
  })

  it('distrusts the CA certificates of NODE_EXTRA_CA_CERTS, which the daemon ignores', async () => {
    const url = await httpsJams()

    await withEnvironment({ SSL_CERT_FILE: undefined, NODE_EXTRA_CA_CERTS: testCa }, async () => {
      assert.equal((await diagnoseJamsSignInFailure(url)).reason, 'certificate')
    })
  })
})

describe('classifyJamsRequestError', () => {
  it('tells certificate errors from network errors', () => {
    const error = (code: string) => Object.assign(new Error(code), { code })

    for (const code of [
      'SELF_SIGNED_CERT_IN_CHAIN',
      'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
      'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      'CERT_HAS_EXPIRED',
      'ERR_TLS_CERT_ALTNAME_INVALID',
    ]) {
      assert.deepEqual(classifyJamsRequestError(error(code)), { reason: 'certificate', detail: code })
    }
    for (const code of ['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET', 'ERR_SSL_WRONG_VERSION_NUMBER']) {
      assert.deepEqual(classifyJamsRequestError(error(code)), { reason: 'unreachable', detail: code })
    }
  })
})

describe('describeJamsSignInFailure', () => {
  it('names the JAMS server and the cause', () => {
    assert.equal(
      describeJamsSignInFailure('https://jams.example', { reason: 'credentials' }),
      'Invalid JAMS credentials',
    )
    assert.equal(
      describeJamsSignInFailure('https://jams.example', {
        reason: 'certificate',
        detail: 'self-signed certificate in certificate chain',
      }),
      'Unable to verify the certificate of the JAMS server https://jams.example: self-signed certificate in certificate chain',
    )
  })
})
