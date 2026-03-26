/*
 * Copyright (C) 2022-2026 Savoir-faire Linux Inc.
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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AccountApi } from '../../src/api/account.js'
import { createMockHttpClient } from '../helpers.js'
import type { HttpClient } from '../../src/http.js'

describe('AccountApi', () => {
  let http: HttpClient
  let api: AccountApi

  beforeEach(() => {
    http = createMockHttpClient()
    api = new AccountApi(http)
  })

  it('get() should call GET /account', async () => {
    const expected = { id: 'acc1', details: {}, volatileDetails: {}, defaultModerators: [], devices: {} }
    vi.mocked(http.get).mockResolvedValue(expected)
    const result = await api.get()
    expect(http.get).toHaveBeenCalledWith('/account')
    expect(result).toEqual(expected)
  })

  it('update() should call PATCH /account with details', async () => {
    vi.mocked(http.patch).mockResolvedValue(undefined)
    await api.update({ 'Account.displayName': 'Alice' })
    expect(http.patch).toHaveBeenCalledWith('/account', { 'Account.displayName': 'Alice' })
  })

  it('setDisplayName() should call POST /account/displayName', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.setDisplayName('Bob')
    expect(http.post).toHaveBeenCalledWith('/account/displayName', { displayName: 'Bob' })
  })

  it('resetDisplayName() should call POST /account/displayName/reset', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.resetDisplayName()
    expect(http.post).toHaveBeenCalledWith('/account/displayName/reset')
  })

  it('revokeDevice() should POST with encoded deviceId and password', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.revokeDevice('dev/1', 'secret')
    expect(http.post).toHaveBeenCalledWith('/account/dev%2F1/revoke', { password: 'secret' })
  })

  it('addDevice() should POST uri', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.addDevice('jami://some-uri')
    expect(http.post).toHaveBeenCalledWith('/account/addDevice', { uri: 'jami://some-uri' })
  })

  it('confirmDevice() should POST with opId', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.confirmDevice(42)
    expect(http.post).toHaveBeenCalledWith('/account/42/confirmDevice')
  })

  it('cancelDevice() should POST with opId', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.cancelDevice(7)
    expect(http.post).toHaveBeenCalledWith('/account/7/cancelDevice')
  })

  it('lookupUsername() should GET with encoded username', async () => {
    const expected = { state: 0, address: 'addr1', name: 'alice' }
    vi.mocked(http.get).mockResolvedValue(expected)
    const result = await api.lookupUsername('alice@test')
    expect(http.get).toHaveBeenCalledWith('/ns/name/alice%40test')
    expect(result).toEqual(expected)
  })

  it('lookupAddress() should GET with encoded address', async () => {
    vi.mocked(http.get).mockResolvedValue({ state: 0, address: 'abc', name: 'alice' })
    await api.lookupAddress('abc')
    expect(http.get).toHaveBeenCalledWith('/ns/address/abc')
  })

  it('checkUsernameAvailability() should HEAD with encoded username', async () => {
    vi.mocked(http.head).mockResolvedValue(404)
    const result = await api.checkUsernameAvailability('newuser')
    expect(http.head).toHaveBeenCalledWith('/ns/name/newuser')
    expect(result).toBe(404)
  })

  it('getDefaultModerators() should GET /default-moderators', async () => {
    const mods = [{ uri: 'u1', registeredName: 'alice' }]
    vi.mocked(http.get).mockResolvedValue(mods)
    const result = await api.getDefaultModerators()
    expect(http.get).toHaveBeenCalledWith('/default-moderators')
    expect(result).toEqual(mods)
  })

  it('addDefaultModerator() should PUT /default-moderators/:id', async () => {
    vi.mocked(http.put).mockResolvedValue(undefined)
    await api.addDefaultModerator('user1')
    expect(http.put).toHaveBeenCalledWith('/default-moderators/user1')
  })

  it('addDefaultModerator() should encode contactId', async () => {
    vi.mocked(http.put).mockResolvedValue(undefined)
    await api.addDefaultModerator('user@domain')
    expect(http.put).toHaveBeenCalledWith('/default-moderators/user%40domain')
  })

  it('removeDefaultModerator() should DELETE /default-moderators/:id', async () => {
    vi.mocked(http.delete).mockResolvedValue(undefined)
    await api.removeDefaultModerator('user1')
    expect(http.delete).toHaveBeenCalledWith('/default-moderators/user1')
  })
})
