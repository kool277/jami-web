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

const accounts = {
  getAll: () => ({ local: {}, jams: {}, openid: {}, guest: {} }),
  remove: (username: string) => accountUsernames.delete(username),
  save: async () => {
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
  Container.set(MockJamid, { removeAccount: () => undefined })
  Container.set(MockAccounts, accounts)
  Container.set(MockAdminAccount, {
    getUploadPath: () => uploadPath + '/',
    getPasswordHash: () => 'hash',
  })
  Container.set(MockApiTokenStore, { revokeAllTokens: () => undefined, save: async () => undefined })
  Container.set(MockOpenIdProviders, { getProviders: () => new Map() })
  Container.set(MockPasskeyStore, {})

  const adminRouterModule = `./admin-router.js?admin-router-test-${randomUUID()}`
  const { adminRouter } = await import(adminRouterModule)
  app = express()
  app.use(express.json())
  app.use('/admin', adminRouter)
})

beforeEach(() => {
  accountUsernames = new Set(['alice'])
  persistedAccountUsernames = new Set(['alice'])
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
