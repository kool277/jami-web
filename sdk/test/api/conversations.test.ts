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
import { ConversationApi } from '../../src/api/conversations.js'
import { createMockHttpClient } from '../helpers.js'
import type { HttpClient } from '../../src/http.js'

describe('ConversationApi', () => {
  let http: HttpClient
  let api: ConversationApi

  beforeEach(() => {
    http = createMockHttpClient()
    api = new ConversationApi(http)
  })

  it('list() should GET /conversations', async () => {
    const convs = [{ id: 'c1' }, { id: 'c2' }]
    vi.mocked(http.get).mockResolvedValue(convs)
    const result = await api.list()
    expect(http.get).toHaveBeenCalledWith('/conversations')
    expect(result).toEqual(convs)
  })

  it('get() should GET /conversations/:id', async () => {
    vi.mocked(http.get).mockResolvedValue({ id: 'c1' })
    await api.get('c1')
    expect(http.get).toHaveBeenCalledWith('/conversations/c1')
  })

  it('get() should encode conversationId', async () => {
    vi.mocked(http.get).mockResolvedValue({})
    await api.get('id/with/slashes')
    expect(http.get).toHaveBeenCalledWith('/conversations/id%2Fwith%2Fslashes')
  })

  it('create() should POST members', async () => {
    vi.mocked(http.post).mockResolvedValue({ id: 'new' })
    await api.create(['user1', 'user2'])
    expect(http.post).toHaveBeenCalledWith('/conversations', { members: ['user1', 'user2'] })
  })

  it('remove() should DELETE /conversations/:id', async () => {
    vi.mocked(http.delete).mockResolvedValue(undefined)
    await api.remove('c1')
    expect(http.delete).toHaveBeenCalledWith('/conversations/c1')
  })

  it('getInfos() should GET /conversations/:id/infos', async () => {
    vi.mocked(http.get).mockResolvedValue({ title: 'My Conv' })
    await api.getInfos('c1')
    expect(http.get).toHaveBeenCalledWith('/conversations/c1/infos')
  })

  it('updateInfos() should POST infos', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.updateInfos('c1', { title: 'New Title' })
    expect(http.post).toHaveBeenCalledWith('/conversations/c1/infos', { title: 'New Title' })
  })

  it('getMembers() should GET /conversations/:id/members', async () => {
    vi.mocked(http.get).mockResolvedValue([{ role: 'admin' }])
    await api.getMembers('c1')
    expect(http.get).toHaveBeenCalledWith('/conversations/c1/members')
  })

  it('addMember() should POST contactUri as array', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.addMember('c1', 'user1')
    expect(http.post).toHaveBeenCalledWith('/conversations/c1/add-to-swarm', {
      contactUri: ['user1'],
    })
  })

  it('removeMember() should POST contactUri', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.removeMember('c1', 'user1')
    expect(http.post).toHaveBeenCalledWith('/conversations/c1/remove-from-swarm', {
      contactUri: 'user1',
    })
  })

  describe('getMessages()', () => {
    it('should GET messages without options', async () => {
      vi.mocked(http.get).mockResolvedValue([])
      await api.getMessages('c1')
      expect(http.get).toHaveBeenCalledWith('/conversations/c1/messages')
    })

    it('should include from parameter', async () => {
      vi.mocked(http.get).mockResolvedValue([])
      await api.getMessages('c1', { from: 'msg-100' })
      expect(http.get).toHaveBeenCalledWith('/conversations/c1/messages?from=msg-100')
    })

    it('should include limit parameter', async () => {
      vi.mocked(http.get).mockResolvedValue([])
      await api.getMessages('c1', { limit: 20 })
      expect(http.get).toHaveBeenCalledWith('/conversations/c1/messages?limit=20')
    })

    it('should include both from and limit', async () => {
      vi.mocked(http.get).mockResolvedValue([])
      await api.getMessages('c1', { from: 'msg-50', limit: 10 })
      expect(http.get).toHaveBeenCalledWith(expect.stringContaining('/conversations/c1/messages?'))
      const url = vi.mocked(http.get).mock.calls[0][0] as string
      expect(url).toContain('from=msg-50')
      expect(url).toContain('limit=10')
    })
  })

  describe('getMessage()', () => {
    it('should request one message from the target id and return an exact match', async () => {
      vi.mocked(http.get).mockResolvedValue([
        { id: 'msg-42', body: 'hello' },
        { id: 'msg-41', body: 'older' },
      ] as any)

      const result = await api.getMessage('c1', 'msg-42')

      expect(http.get).toHaveBeenCalledWith('/conversations/c1/messages?from=msg-42&limit=1')
      expect(result).toEqual({ id: 'msg-42', body: 'hello' })
    })

    it('should return undefined when the server page does not contain the target id', async () => {
      vi.mocked(http.get).mockResolvedValue([{ id: 'msg-41', body: 'older' }] as any)

      const result = await api.getMessage('c1', 'msg-42')

      expect(result).toBeUndefined()
    })
  })

  it('sendMessage() should POST message', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.sendMessage('c1', 'Hello!')
    expect(http.post).toHaveBeenCalledWith('/conversations/c1/messages', {
      body: 'Hello!',
      replyTo: undefined,
    })
  })

  it('sendMessage() should include replyTo', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.sendMessage('c1', 'Reply text', 'msg-42')
    expect(http.post).toHaveBeenCalledWith('/conversations/c1/messages', {
      body: 'Reply text',
      replyTo: 'msg-42',
    })
  })

  it('editMessage() should POST with messageId and message', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.editMessage('c1', 'msg-1', 'Edited text')
    expect(http.post).toHaveBeenCalledWith('/conversations/c1/editmessage', {
      message: 'Edited text',
      messageId: 'msg-1',
    })
  })

  it('deleteMessage() should DELETE with conversationId and messageId', async () => {
    vi.mocked(http.delete).mockResolvedValue(undefined)
    await api.deleteMessage('c1', 'msg-1')
    expect(http.delete).toHaveBeenCalledWith('/conversations/delete/c1/msg-1')
  })

  it('getPreferences() should GET preferences', async () => {
    vi.mocked(http.get).mockResolvedValue({ theme: 'dark' })
    const result = await api.getPreferences('c1')
    expect(http.get).toHaveBeenCalledWith('/conversations/c1/preferences')
    expect(result).toEqual({ theme: 'dark' })
  })

  it('setPreferences() should POST preferences', async () => {
    vi.mocked(http.post).mockResolvedValue(undefined)
    await api.setPreferences('c1', { theme: 'light' })
    expect(http.post).toHaveBeenCalledWith('/conversations/c1/preferences', { theme: 'light' })
  })
})
