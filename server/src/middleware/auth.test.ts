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
import { createServer } from 'node:http'
import { after, before, describe, it, mock } from 'node:test'

import { HttpStatusCode } from '@savoirfairelinux/jami-web-common'
import express from 'express'
import { Container } from 'typedi'

class MockAccounts {}
class MockApiTokenStore {}

const accounts = {
  isValidAccountId: (accountId: string) => accountId === 'account-1',
  isSessionValid: (_accountId: string, issuedAt: unknown) => issuedAt === 11,
}

mock.module('../storage/accounts.js', { namedExports: { Accounts: MockAccounts } })
mock.module('../storage/api-tokens.js', { namedExports: { ApiTokenStore: MockApiTokenStore } })
mock.module('../utils/electron.js', { namedExports: { isElectronMode: false } })
mock.module('../utils/jwt.js', {
  namedExports: {
    verifyJwt: async (token: string) => ({ payload: { accountId: 'account-1', iat: token === 'current' ? 11 : 10 } }),
  },
})

let app: express.Express

before(async () => {
  Container.set(MockAccounts, accounts)
  Container.set(MockApiTokenStore, { validateToken: () => undefined })
  const authModulePath = './auth.js?session-invalidation-test'
  const { authenticateToken } = await import(authModulePath)

  app = express()
  app.get('/protected', authenticateToken, (_req, res) => res.sendStatus(HttpStatusCode.NoContent))
})

after(() => {
  mock.restoreAll()
  Container.remove(MockAccounts)
  Container.remove(MockApiTokenStore)
})

async function request(token: string): Promise<Response> {
  const server = createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    return await fetch(`http://127.0.0.1:${address.port}/protected`, {
      headers: { authorization: `Bearer ${token}` },
    })
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
}

describe('authenticateToken session invalidation', () => {
  it('rejects a JWT issued before its account session invalidation marker', async () => {
    const response = await request('stale')

    assert.equal(response.status, HttpStatusCode.Unauthorized)
  })

  it('accepts a JWT issued after its account session invalidation marker', async () => {
    const response = await request('current')

    assert.equal(response.status, HttpStatusCode.NoContent)
  })
})
