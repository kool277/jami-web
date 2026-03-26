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
import { ConversationRequestApi } from '../../src/api/conversation-requests.js'
import { createMockHttpClient } from '../helpers.js'
import type { HttpClient } from '../../src/http.js'

describe('ConversationRequestApi', () => {
  let http: HttpClient
  let api: ConversationRequestApi

  beforeEach(() => {
    http = createMockHttpClient()
    api = new ConversationRequestApi(http)
  })

  it('list() should GET /conversation-requests', async () => {
    const requests = [{ conversationId: 'c1', from: { uri: 'u1' } }]
    vi.mocked(http.get).mockResolvedValue(requests)
    const result = await api.list()
    expect(http.get).toHaveBeenCalledWith('/conversation-requests')
    expect(result).toEqual(requests)
  })

  it('accept() should POST /conversation-requests/:id', async () => {
    const summary = { id: 'c1', title: 'Chat' }
    vi.mocked(http.post).mockResolvedValue(summary)
    const result = await api.accept('c1')
    expect(http.post).toHaveBeenCalledWith('/conversation-requests/c1')
    expect(result).toEqual(summary)
  })

  it('accept() should encode conversationId', async () => {
    vi.mocked(http.post).mockResolvedValue({})
    await api.accept('id/special')
    expect(http.post).toHaveBeenCalledWith('/conversation-requests/id%2Fspecial')
  })

  it('decline() should DELETE /conversation-requests/:id', async () => {
    vi.mocked(http.delete).mockResolvedValue(undefined)
    await api.decline('c1')
    expect(http.delete).toHaveBeenCalledWith('/conversation-requests/c1')
  })

  it('block() should POST /conversation-requests/:id/block', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.block('c1')
    expect(http.post).toHaveBeenCalledWith('/conversation-requests/c1/block')
  })
})
