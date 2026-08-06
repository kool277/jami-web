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
import { after, before, beforeEach, describe, it, mock } from 'node:test'

import express from 'express'
import { Container } from 'typedi'

const removedPendingAccounts: string[] = []
const providedAuthentications: Array<{ accountId: string; credentials: string; scheme: string }> = []

class MockJamid {}
class MockAccounts {}
class MockAdminAccount {}
class MockOpenIdProviders {}

const jamid = {
  getLinkToken: () => undefined,
  provideAccountAuthentication: (accountId: string, credentials: string, scheme: string) => {
    providedAuthentications.push({ accountId, credentials, scheme })
    return true
  },
}

const accounts = {
  getPendingAccounts: () => ({}),
  addPendingAccount: () => undefined,
  removeAndDeletePendingAccount: (accountId: string) => {
    removedPendingAccounts.push(accountId)
  },
  save: () => undefined,
}

mock.module('../jamid/jamid.js', { namedExports: { Jamid: MockJamid } })
mock.module('../storage/accounts.js', { namedExports: { Accounts: MockAccounts } })
mock.module('../storage/admin-account.js', { namedExports: { AdminAccount: MockAdminAccount } })
mock.module('../storage/openid-providers.js', { namedExports: { OpenIdProviders: MockOpenIdProviders } })
mock.module('../utils/guests.js', { namedExports: { clearGuest: () => undefined, clearGuests: () => undefined } })
mock.module('../utils/electron.js', { namedExports: { isElectronMode: false } })
mock.module('../utils/jwt.js', {
  namedExports: {
    signJwt: async () => 'jwt',
    signJwtWithExpiration: async () => 'jwt',
    verifyJwt: async () => ({ payload: { accountId: 'account-1' } }),
  },
})
mock.module('../utils/password.js', {
  namedExports: { hashPassword: async (password: string) => password, verifyPassword: async () => true },
})
mock.module('../utils/openid.js', {
  namedExports: {
    exchangeCodeForToken: async () => undefined,
    exchangeTokenForUserInfo: async () => undefined,
    getBase64Picture: async () => undefined,
    getJwt: async () => undefined,
  },
})

let app: express.Express

before(async () => {
  Container.set(MockJamid, jamid)
  Container.set(MockAccounts, accounts)
  Container.set(MockAdminAccount, {})
  Container.set(MockOpenIdProviders, { getProviders: () => [] })
  const authRouterModule = './auth-router.js?auth-router-test'
  const { authRouter } = await import(authRouterModule)
  app = express()
  app.use(express.json())
  app.use('/auth', authRouter)
})

beforeEach(() => {
  removedPendingAccounts.length = 0
  providedAuthentications.length = 0
})

after(() => {
  mock.restoreAll()
  Container.remove(MockJamid)
  Container.remove(MockAccounts)
  Container.remove(MockAdminAccount)
  Container.remove(MockOpenIdProviders)
})

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const server = createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    // A handler that never answers would otherwise hang the test run.
    return await fetch(`http://127.0.0.1:${address.port}${path}`, { ...init, signal: AbortSignal.timeout(2000) })
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
}

describe('auth router device linking', () => {
  it('answers the cancellation of a pending link', async () => {
    const response = await request('/auth/link/cancel', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accountId: 'account-1' }),
    })

    assert.equal(response.status, 200)
    assert.deepEqual(removedPendingAccounts, ['account-1'])
  })

  it('answers an authentication attempt', async () => {
    const response = await request('/auth/link/authenticate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ values: { accountId: 'account-1', password: '', scheme: 'password' } }),
    })

    assert.equal(response.status, 200)
    assert.deepEqual(providedAuthentications, [{ accountId: 'account-1', credentials: '', scheme: 'password' }])
  })
})
