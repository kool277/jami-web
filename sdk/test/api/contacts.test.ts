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
import { ContactApi } from '../../src/api/contacts.js'
import { createMockHttpClient } from '../helpers.js'
import type { HttpClient } from '../../src/http.js'

describe('ContactApi', () => {
  let http: HttpClient
  let api: ContactApi

  beforeEach(() => {
    http = createMockHttpClient()
    api = new ContactApi(http)
  })

  it('list() should GET /contacts', async () => {
    const contacts = [{ id: 'c1', conversationId: 'conv1', added: '', confirmed: '', username: 'alice' }]
    vi.mocked(http.get).mockResolvedValue(contacts)
    const result = await api.list()
    expect(http.get).toHaveBeenCalledWith('/contacts')
    expect(result).toEqual(contacts)
  })

  it('get() should GET /contacts/:id', async () => {
    vi.mocked(http.get).mockResolvedValue({ id: 'c1' })
    await api.get('c1')
    expect(http.get).toHaveBeenCalledWith('/contacts/c1')
  })

  it('get() should encode contactId', async () => {
    vi.mocked(http.get).mockResolvedValue({})
    await api.get('user@domain')
    expect(http.get).toHaveBeenCalledWith('/contacts/user%40domain')
  })

  it('add() should PUT /contacts/:id', async () => {
    vi.mocked(http.put).mockResolvedValue({ id: 'c1' })
    const result = await api.add('c1')
    expect(http.put).toHaveBeenCalledWith('/contacts/c1')
    expect(result).toEqual({ id: 'c1' })
  })

  it('remove() should DELETE /contacts/:id', async () => {
    vi.mocked(http.delete).mockResolvedValue(undefined)
    await api.remove('c1')
    expect(http.delete).toHaveBeenCalledWith('/contacts/c1')
  })

  it('block() should POST /contacts/:id/block', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.block('c1')
    expect(http.post).toHaveBeenCalledWith('/contacts/c1/block')
  })

  it('getProfilePictureUrl() should return correct URL', () => {
    expect(api.getProfilePictureUrl('user1')).toBe('/contacts/user1/profile/picture')
  })

  it('getProfilePictureUrl() should encode URI', () => {
    expect(api.getProfilePictureUrl('a/b')).toBe('/contacts/a%2Fb/profile/picture')
  })
})
