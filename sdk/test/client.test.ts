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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { JamiClient } from '../src/client.js'
import { AccountApi } from '../src/api/account.js'
import { ConversationApi } from '../src/api/conversations.js'
import { ContactApi } from '../src/api/contacts.js'
import { CallApi } from '../src/api/calls.js'
import { DataTransferApi } from '../src/api/data-transfer.js'
import { TokenApi } from '../src/api/tokens.js'
import { ConversationRequestApi } from '../src/api/conversation-requests.js'
import { EventClient } from '../src/realtime/event-client.js'
import { mockResponse, mockErrorResponse } from './helpers.js'

describe('JamiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor with token auth', () => {
    it('should initialize all API sub-clients', () => {
      const client = new JamiClient({ server: 'https://jami.example.com', token: 'tok' })
      expect(client.account).toBeInstanceOf(AccountApi)
      expect(client.conversations).toBeInstanceOf(ConversationApi)
      expect(client.contacts).toBeInstanceOf(ContactApi)
      expect(client.calls).toBeInstanceOf(CallApi)
      expect(client.dataTransfer).toBeInstanceOf(DataTransferApi)
      expect(client.tokens).toBeInstanceOf(TokenApi)
      expect(client.conversationRequests).toBeInstanceOf(ConversationRequestApi)
      expect(client.events).toBeInstanceOf(EventClient)
    })

    it('should strip trailing slashes from server URL', async () => {
      const fetchSpy = vi.fn().mockResolvedValue(mockResponse({ id: '1' }))
      vi.stubGlobal('fetch', fetchSpy)

      const client = new JamiClient({ server: 'https://jami.example.com/', token: 'tok' })
      // Trigger a request to verify URL construction
      await client.account.get()
      expect(fetchSpy).toHaveBeenCalledWith('https://jami.example.com/api/account', expect.anything())
    })

    it('should use provided token for requests', async () => {
      const fetchSpy = vi.fn().mockResolvedValue(mockResponse({}))
      vi.stubGlobal('fetch', fetchSpy)

      const client = new JamiClient({ server: 'https://jami.example.com', token: 'my-token' })
      await client.account.get()
      const [, init] = fetchSpy.mock.calls[0]
      expect(init.headers.Authorization).toBe('Bearer my-token')
    })
  })

  describe('constructor with credential auth', () => {
    it('should authenticate on first request', async () => {
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)

      // First call: login
      fetchSpy.mockResolvedValueOnce(mockResponse({ accessToken: 'jwt-token-123' }))
      // Second call: actual API request
      fetchSpy.mockResolvedValueOnce(mockResponse({ id: 'account-1' }))

      const client = new JamiClient({
        server: 'https://jami.example.com',
        credentials: { username: 'alice', password: 'pass' },
      })

      await client.account.get()

      // Verify login request
      expect(fetchSpy).toHaveBeenCalledTimes(2)
      const [loginUrl, loginInit] = fetchSpy.mock.calls[0]
      expect(loginUrl).toBe('https://jami.example.com/api/auth/login')
      expect(loginInit.method).toBe('POST')
      expect(JSON.parse(loginInit.body)).toEqual({
        username: 'alice',
        password: 'pass',
        authMethod: 'local',
      })
    })

    it('should reuse token after login', async () => {
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)

      fetchSpy.mockResolvedValueOnce(mockResponse({ accessToken: 'jwt-123' }))
      fetchSpy.mockResolvedValueOnce(mockResponse({ id: 'acc' }))
      fetchSpy.mockResolvedValueOnce(mockResponse([]))

      const client = new JamiClient({
        server: 'https://jami.example.com',
        credentials: { username: 'bob', password: 'pass' },
      })

      await client.account.get()
      await client.contacts.list()

      // Login only once, then 2 API calls
      expect(fetchSpy).toHaveBeenCalledTimes(3)
      // Second and third calls should use cached token
      const [, secondInit] = fetchSpy.mock.calls[1]
      const [, thirdInit] = fetchSpy.mock.calls[2]
      expect(secondInit.headers.Authorization).toBe('Bearer jwt-123')
      expect(thirdInit.headers.Authorization).toBe('Bearer jwt-123')
    })

    it('should use custom authMethod when specified', async () => {
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)

      fetchSpy.mockResolvedValueOnce(mockResponse({ accessToken: 'tok' }))
      fetchSpy.mockResolvedValueOnce(mockResponse({}))

      const client = new JamiClient({
        server: 'https://jami.example.com',
        credentials: { username: 'alice', password: 'pass', authMethod: 'jams' },
      })

      await client.account.get()

      const [, loginInit] = fetchSpy.mock.calls[0]
      expect(JSON.parse(loginInit.body).authMethod).toBe('jams')
    })

    it('should throw on authentication failure', async () => {
      const fetchSpy = vi.fn()
      vi.stubGlobal('fetch', fetchSpy)

      fetchSpy.mockResolvedValueOnce(mockErrorResponse(401, 'Invalid credentials'))

      const client = new JamiClient({
        server: 'https://jami.example.com',
        credentials: { username: 'alice', password: 'wrong' },
      })

      await expect(client.account.get()).rejects.toThrow('Authentication failed')
    })
  })
})
