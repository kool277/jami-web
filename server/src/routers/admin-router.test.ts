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
import { randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, before, beforeEach, describe, it, mock } from 'node:test'

import express from 'express'
import { Container } from 'typedi'

class MockJamid {}
class MockAccounts {}
class MockAdminAccount {}
class MockApiTokenStore {}
class MockOpenIdProviders {}
class MockPasskeyStore {}

const uploadPath = mkdtempSync(join(tmpdir(), 'jami-web-admin-router-test-'))
let accountUsernames = new Set<string>()
let persistedAccountUsernames = new Set<string>()
let localCredentials = new Map<string, { accountId: string; password: string }>()
const revokedAccountIds: string[] = []
const removedAccountIds: string[] = []
let failNextAccountSave = false

const accounts = {
  getAll: () => ({ local: {}, jams: {}, openid: {}, guest: {} }),
  get: (username: string) => (accountUsernames.has(username) ? (localCredentials.get(username) ?? {}) : undefined),
  set: (username: string, password: string, _auth: string, accountId: string) => {
    accountUsernames.add(username)
    localCredentials.set(username, { accountId, password })
  },
  getLocalByAccountId: (accountId: string) =>
    [...localCredentials.values()].find((credential) => credential.accountId === accountId),
  updateLocalPassword: (accountId: string, password: string) => {
    const credential = [...localCredentials.values()].find((item) => item.accountId === accountId)
    if (!credential) return false
    credential.password = password
    return true
  },
  remove: (username: string) => {
    localCredentials.delete(username)
    return accountUsernames.delete(username)
  },
  save: async () => {
    if (failNextAccountSave) {
      failNextAccountSave = false
      throw new Error('Unable to persist account credentials')
    }
    persistedAccountUsernames = new Set(accountUsernames)
  },
  reload: () => {
    accountUsernames = new Set(persistedAccountUsernames)
  },
}

mock.module('../jamid/jamid.js', { namedExports: { Jamid: MockJamid } })
mock.module('../storage/accounts.js', { namedExports: { Accounts: MockAccounts } })
mock.module('../storage/admin-account.js', { namedExports: { AdminAccount: MockAdminAccount } })
mock.module('../storage/api-tokens.js', { namedExports: { ApiTokenStore: MockApiTokenStore } })
mock.module('../storage/openid-providers.js', { namedExports: { OpenIdProviders: MockOpenIdProviders } })
mock.module('../storage/passkey-store.js', { namedExports: { PasskeyStore: MockPasskeyStore } })
mock.module('../middleware/auth.js', {
  namedExports: {
    adminAuthenticationMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) =>
      next(),
  },
})
mock.module('../middleware/setup.js', {
  namedExports: {
    checkAdminSetup: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  },
})
mock.module('../utils/electron.js', { namedExports: { isElectronMode: false } })
mock.module('../utils/jwt.js', { namedExports: { signJwt: async () => 'jwt' } })
mock.module('../utils/password.js', {
  namedExports: { hashPassword: async (password: string) => password, verifyPassword: async () => true },
})

let app: express.Express

before(async () => {
  Container.set(MockJamid, {
    addAccount: async () => ({ accountId: 'new-account' }),
    registerUsername: async () => 0,
    removeAccount: (accountId: string) => removedAccountIds.push(accountId),
  })
  Container.set(MockAccounts, accounts)
  Container.set(MockAdminAccount, {
    getUploadPath: () => uploadPath + '/',
    getPasswordHash: () => 'hash',
    getNameServerAddress: () => '',
  })
  Container.set(MockApiTokenStore, {
    revokeAllTokens: (accountId: string) => revokedAccountIds.push(accountId),
    save: async () => undefined,
  })
  Container.set(MockOpenIdProviders, { getProviders: () => new Map() })
  Container.set(MockPasskeyStore, { removeAll: () => false })

  const adminRouterModule = `./admin-router.js?admin-router-test-${randomUUID()}`
  const { adminRouter } = await import(adminRouterModule)
  app = express()
  app.use(express.json())
  app.use('/admin', adminRouter)
})

beforeEach(() => {
  accountUsernames = new Set(['alice'])
  persistedAccountUsernames = new Set(['alice'])
  localCredentials = new Map([['alice', { accountId: 'account-1', password: 'old-password' }]])
  revokedAccountIds.length = 0
  removedAccountIds.length = 0
  failNextAccountSave = false
})

after(() => {
  rmSync(uploadPath, { recursive: true, force: true })
  mock.restoreAll()
  Container.remove(MockJamid)
  Container.remove(MockAccounts)
  Container.remove(MockAdminAccount)
  Container.remove(MockApiTokenStore)
  Container.remove(MockOpenIdProviders)
  Container.remove(MockPasskeyStore)
})

async function request(path: string, init: RequestInit): Promise<Response> {
  const server = createServer(app)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    const address = server.address()
    assert.ok(address && typeof address !== 'string')
    return await fetch(`http://127.0.0.1:${address.port}${path}`, { ...init, signal: AbortSignal.timeout(2000) })
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
}

describe('DELETE /admin/accounts', () => {
  it('persists account deletion so it remains deleted after the account store reloads', async () => {
    const response = await request('/admin/accounts', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([
        { username: 'alice', accountId: 'account-1', accountUri: 'alice', auth: 'local', storage: 0 },
      ]),
    })

    assert.equal(response.status, 200)
    accounts.reload()
    assert.equal(accountUsernames.has('alice'), false)
  })
})

describe('POST /admin/accounts', () => {
  it('creates a local account even when self-registration is disabled', async () => {
    const response = await request('/admin/accounts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'bob', password: 'secure-password' }),
    })

    assert.equal(response.status, 201)
    assert.deepEqual(await response.json(), { accountId: 'new-account' })
    assert.deepEqual(localCredentials.get('bob'), { accountId: 'new-account', password: 'secure-password' })
  })

  it('rejects duplicate usernames and short passwords', async () => {
    for (const body of [
      { username: 'alice', password: 'secure-password' },
      { username: 'bob', password: 'short' },
    ]) {
      const response = await request('/admin/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      assert.equal(response.status, body.username === 'alice' ? 409 : 400)
    }
  })

  it('rolls back a registered account when credential persistence fails', async () => {
    failNextAccountSave = true

    const response = await request('/admin/accounts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'bob', password: 'secure-password' }),
    })

    assert.equal(response.status, 500)
    assert.equal(localCredentials.has('bob'), false)
    assert.deepEqual(removedAccountIds, ['new-account'])
  })
})

describe('PATCH /admin/accounts/:accountId/password', () => {
  it('updates a local password and revokes its tokens', async () => {
    const response = await request('/admin/accounts/account-1/password', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'new-secure-password' }),
    })

    assert.equal(response.status, 204)
    assert.equal(localCredentials.get('alice')?.password, 'new-secure-password')
    assert.deepEqual(revokedAccountIds, ['account-1'])
  })

  it('rejects password resets for non-local accounts', async () => {
    const response = await request('/admin/accounts/not-local/password', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: 'new-secure-password' }),
    })

    assert.equal(response.status, 400)
  })
})
