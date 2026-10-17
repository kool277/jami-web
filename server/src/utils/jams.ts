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
import { execFile } from 'node:child_process'

/** Why the daemon could not sign in to JAMS. */
export type JamsSignInFailure =
  { reason: 'credentials' } | { reason: 'certificate' | 'unreachable' | 'not-jams' | 'server-error'; detail: string }

// The daemon signs in by asking JAMS for a device certificate there.
const devicePath = '/api/auth/device'
// The daemon's HTTP client (OpenDHT) follows up to five 301 and 302 redirections, and no others.
const maxRedirections = 5

type ProbeResult = { status: number; location?: string } | { error: Error & { code?: string } }

/**
 * The daemon reports any failure to sign in to JAMS as ERROR_GENERIC. To tell refused credentials
 * from a server it could not reach or trust, request the endpoint it signs in with, as it does but
 * without the credentials: a JAMS that works answers 401.
 */
export async function diagnoseJamsSignInFailure(jamsUrl: string, timeoutMs = 5000): Promise<JamsSignInFailure> {
  // Like the daemon, append the path to the URL as given and default to HTTP.
  let url = (/^[a-z][a-z\d+.-]*:\/\//i.test(jamsUrl) ? jamsUrl : `http://${jamsUrl}`) + devicePath
  for (let redirections = 0; ; redirections++) {
    const result = await probe(url, timeoutMs)
    if ('error' in result) {
      return classifyJamsRequestError(result.error)
    }
    if ((result.status === 301 || result.status === 302) && result.location && redirections < maxRedirections) {
      url = new URL(result.location, url).href
      continue
    }
    return classifyJamsResponse(result.status, result.location)
  }
}

export function classifyJamsResponse(status: number, location?: string): JamsSignInFailure {
  // JAMS asks for credentials there: any other answer comes from another server.
  if (status === 401 || status === 403) {
    return { reason: 'credentials' }
  }
  if (status >= 300 && status < 400) {
    return { reason: 'not-jams', detail: `HTTP ${status}, redirection to ${location ?? 'nowhere'}` }
  }
  if (status >= 500) {
    return { reason: 'server-error', detail: `HTTP ${status}` }
  }
  return { reason: 'not-jams', detail: `HTTP ${status}` }
}

export function classifyJamsRequestError(error: Error & { code?: string }): JamsSignInFailure {
  // OpenSSL's certificate verification errors, as Node.js names them.
  if (error.code && /CERT|UNABLE_TO_VERIFY_LEAF_SIGNATURE|HOSTNAME_MISMATCH|INVALID_CA/.test(error.code)) {
    return { reason: 'certificate', detail: error.message }
  }
  return { reason: 'unreachable', detail: error.message }
}

export function describeJamsSignInFailure(jamsUrl: string, failure: JamsSignInFailure): string {
  switch (failure.reason) {
    case 'credentials':
      return 'Invalid JAMS credentials'
    case 'certificate':
      return `Unable to verify the certificate of the JAMS server ${jamsUrl}: ${failure.detail}`
    case 'unreachable':
      return `Unable to reach the JAMS server ${jamsUrl}: ${failure.detail}`
    case 'not-jams':
      return `No JAMS server at ${jamsUrl}: ${failure.detail}`
    case 'server-error':
      return `The JAMS server ${jamsUrl} failed: ${failure.detail}`
  }
}

// Requests the URL (argument 1) with a timeout in milliseconds (argument 2), and prints its
// status and location, or the error, as JSON.
const probeScript = `
const [url, timeoutMs] = process.argv.slice(1)
const print = (result) => console.log(JSON.stringify(result))
const fail = (error) => print({ error: { code: error.code, message: error.message } })
try {
  const target = new URL(url)
  const request = require(target.protocol === 'https:' ? 'node:https' : 'node:http').request(
    target,
    { agent: false, timeout: Number(timeoutMs) },
    (response) => {
      response.resume()
      print({ status: response.statusCode, location: response.headers.location })
    },
  )
  request.on('timeout', () => request.destroy(new Error('no answer within ' + timeoutMs / 1000 + ' s')))
  request.on('error', fail)
  request.end()
} catch (error) {
  fail(error)
}
`

/**
 * The daemon runs in this process, where its OpenSSL calls go to the OpenSSL of Node.js: it trusts
 * the CA certificates in OpenSSL's default locations (SSL_CERT_FILE and SSL_CERT_DIR, or the
 * defaults under OPENSSLDIR), not the CA store of Node.js nor NODE_EXTRA_CA_CERTS. Only
 * --use-openssl-ca gives Node.js the same, for a whole process: request from a child process.
 */
function probe(url: string, timeoutMs: number): Promise<ProbeResult> {
  const env = { ...process.env }
  delete env.NODE_EXTRA_CA_CERTS
  delete env.NODE_OPTIONS
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      ['--use-openssl-ca', '-e', probeScript, url, String(timeoutMs)],
      { env, timeout: timeoutMs + 5000 },
      (error, stdout, stderr) => {
        try {
          const result = JSON.parse(stdout) as ProbeResult | { error: { code?: string; message: string } }
          resolve('error' in result ? { error: Object.assign(new Error(result.error.message), result.error) } : result)
        } catch {
          resolve({ error: new Error(`unable to check: ${stderr.trim() || error?.message}`) })
        }
      },
    )
  })
}
