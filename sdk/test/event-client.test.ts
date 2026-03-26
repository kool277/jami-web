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
import { EventClient } from '../src/realtime/event-client.js'
import { WebSocketMessageType } from 'jami-web-common'

// Minimal WebSocket mock
class MockWebSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3
  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSING = 2
  readonly CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string
  onopen: ((ev: Event) => void) | null = null
  onclose: ((ev: CloseEvent) => void) | null = null
  onmessage: ((ev: MessageEvent) => void) | null = null
  onerror: ((ev: Event) => void) | null = null
  send = vi.fn()
  close = vi.fn()

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
  }

  static instances: MockWebSocket[] = []

  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.(new Event('open'))
  }

  simulateMessage(data: unknown): void {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }))
  }

  simulateClose(): void {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.({} as CloseEvent)
  }

  simulateError(): void {
    this.onerror?.(new Event('error'))
  }
}

/** Helper: connect and immediately open */
async function connectAndOpen(client: EventClient): Promise<MockWebSocket> {
  const p = client.connect()
  await Promise.resolve()
  const ws = MockWebSocket.instances[MockWebSocket.instances.length - 1]
  ws.simulateOpen()
  await p
  return ws
}

describe('EventClient', () => {
  let client: EventClient

  beforeEach(() => {
    MockWebSocket.instances = []
    vi.stubGlobal('WebSocket', MockWebSocket)
    client = new EventClient('https://jami.example.com', () => 'ws-token')
  })

  afterEach(() => {
    client.disconnect()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('connect()', () => {
    it('should create WebSocket with correct URL', async () => {
      const ws = await connectAndOpen(client)
      expect(ws.url).toBe('wss://jami.example.com/api?accessToken=ws-token')
    })

    it('should use ws:// for http:// servers', async () => {
      const httpClient = new EventClient('http://localhost:5002', () => 'tok')
      const ws = await connectAndOpen(httpClient)
      expect(ws.url).toBe('ws://localhost:5002/api?accessToken=tok')
      httpClient.disconnect()
    })

    it('should set connected to true after open', async () => {
      expect(client.connected).toBe(false)
      await connectAndOpen(client)
      expect(client.connected).toBe(true)
    })

    it('should reject on error before open', async () => {
      const p = client.connect()
      await Promise.resolve()
      MockWebSocket.instances[0].simulateError()
      await expect(p).rejects.toThrow('WebSocket connection failed')
    })
  })

  describe('disconnect()', () => {
    it('should close WebSocket and set connected to false', async () => {
      const ws = await connectAndOpen(client)
      client.disconnect()
      expect(ws.close).toHaveBeenCalled()
      expect(client.connected).toBe(false)
    })

    it('should cancel pending reconnect timers', async () => {
      vi.useFakeTimers()
      const ws = await connectAndOpen(client)
      ws.simulateClose()
      client.disconnect()

      await vi.advanceTimersByTimeAsync(5000)
      expect(MockWebSocket.instances).toHaveLength(1)
    })

    it('should be idempotent', () => {
      client.disconnect()
      client.disconnect()
    })
  })

  describe('on() and message dispatching', () => {
    it('should dispatch messages to registered handlers', async () => {
      const ws = await connectAndOpen(client)
      const handler = vi.fn()
      client.on(WebSocketMessageType.ConversationMessage, handler)

      ws.simulateMessage({
        type: WebSocketMessageType.ConversationMessage,
        data: { conversationId: 'c1', body: 'Hello' },
      })
      expect(handler).toHaveBeenCalledWith({ conversationId: 'c1', body: 'Hello' })
    })

    it('should support multiple handlers for the same type', async () => {
      const ws = await connectAndOpen(client)
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      client.on(WebSocketMessageType.ConversationMessage, handler1)
      client.on(WebSocketMessageType.ConversationMessage, handler2)

      ws.simulateMessage({
        type: WebSocketMessageType.ConversationMessage,
        data: { text: 'hi' },
      })
      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should return unsubscribe function', async () => {
      const ws = await connectAndOpen(client)
      const handler = vi.fn()
      const unsub = client.on(WebSocketMessageType.ConversationMessage, handler)

      ws.simulateMessage({ type: WebSocketMessageType.ConversationMessage, data: { n: 1 } })
      expect(handler).toHaveBeenCalledTimes(1)

      unsub()
      ws.simulateMessage({ type: WebSocketMessageType.ConversationMessage, data: { n: 2 } })
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should ignore messages with no registered handlers', async () => {
      const ws = await connectAndOpen(client)
      ws.simulateMessage({ type: 'unknown-type', data: {} })
    })

    it('should ignore malformed messages', async () => {
      const ws = await connectAndOpen(client)
      ws.onmessage?.(new MessageEvent('message', { data: 'not json{{{' }))
    })
  })

  describe('send()', () => {
    it('should send JSON when connected', async () => {
      const ws = await connectAndOpen(client)
      client.send(WebSocketMessageType.ConversationView, { conversationId: 'c1' } as any)
      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({ type: WebSocketMessageType.ConversationView, data: { conversationId: 'c1' } }),
      )
    })

    it('should queue messages when not connected', () => {
      client.send(WebSocketMessageType.ConversationView, { conversationId: 'c1' } as any)
      expect(MockWebSocket.instances).toHaveLength(0)
    })

    it('should flush queued messages on connect', async () => {
      client.send(WebSocketMessageType.ConversationView, { conversationId: 'c1' } as any)
      client.send(WebSocketMessageType.ConversationView, { conversationId: 'c2' } as any)
      const ws = await connectAndOpen(client)
      expect(ws.send).toHaveBeenCalledTimes(2)
    })
  })

  describe('reconnection', () => {
    it('should attempt reconnect after connection loss', async () => {
      vi.useFakeTimers()
      const ws = await connectAndOpen(client)
      ws.simulateClose()
      expect(MockWebSocket.instances).toHaveLength(1)

      await vi.advanceTimersByTimeAsync(1000)
      expect(MockWebSocket.instances).toHaveLength(2)
    })

    it('should not reconnect after explicit disconnect', async () => {
      vi.useFakeTimers()
      await connectAndOpen(client)
      client.disconnect()

      await vi.advanceTimersByTimeAsync(60000)
      expect(MockWebSocket.instances).toHaveLength(1)
    })

    it('should reset backoff after successful reconnect', async () => {
      vi.useFakeTimers()
      const ws1 = await connectAndOpen(client)
      ws1.simulateClose()

      await vi.advanceTimersByTimeAsync(1000)
      MockWebSocket.instances[1].simulateOpen()

      MockWebSocket.instances[1].simulateClose()
      await vi.advanceTimersByTimeAsync(1000)
      expect(MockWebSocket.instances).toHaveLength(3)
    })
  })
})
