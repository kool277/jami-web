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

import type { WebSocketMessageTable } from 'jami-web-common'
import { WebSocketMessageType } from 'jami-web-common'

type Handler<T extends WebSocketMessageType> = (data: WebSocketMessageTable[T]) => void

interface QueuedMessage {
  type: string
  data: unknown
}

export class EventClient {
  private ws: WebSocket | null = null
  private handlers = new Map<string, Set<Handler<any>>>()
  private queue: QueuedMessage[] = []
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 1000
  private maxReconnectDelay = 30000
  private shouldReconnect = false

  private readonly serverUrl: string
  private readonly getToken: () => string | Promise<string>

  constructor(serverUrl: string, getToken: () => string | Promise<string>) {
    this.serverUrl = serverUrl
    this.getToken = getToken
  }

  async connect(): Promise<void> {
    this.shouldReconnect = true
    return this.doConnect()
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  on<T extends WebSocketMessageType>(type: T, handler: (data: WebSocketMessageTable[T]) => void): () => void {
    let set = this.handlers.get(type)
    if (!set) {
      set = new Set()
      this.handlers.set(type, set)
    }
    set.add(handler as Handler<any>)
    return () => {
      set!.delete(handler as Handler<any>)
      if (set!.size === 0) this.handlers.delete(type)
    }
  }

  send<T extends WebSocketMessageType>(type: T, data: WebSocketMessageTable[T]): void {
    const msg = { type, data }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    } else {
      this.queue.push(msg)
    }
  }

  get connected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  private async doConnect(): Promise<void> {
    const token = await this.getToken()
    const httpUrl = new URL(this.serverUrl)
    const protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    const encodedToken = encodeURIComponent(token)
    const url = `${protocol}//${httpUrl.host}/api?accessToken=${encodedToken}`

    await this.connectToUrl(url)
  }

  private connectToUrl(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url)
      let settled = false

      ws.onopen = () => {
        settled = true
        this.ws = ws
        this.reconnectDelay = 1000
        this.flushQueue()
        resolve()
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(typeof event.data === 'string' ? event.data : '')
          const handlers = this.handlers.get(msg.type)
          if (handlers) {
            for (const handler of handlers) {
              handler(msg.data)
            }
          }
        } catch {
          // Ignore malformed messages
        }
      }

      ws.onclose = () => {
        this.ws = null
        if (!settled) {
          settled = true
          reject(new Error('WebSocket connection closed before opening'))
          return
        }
        if (this.shouldReconnect) {
          this.scheduleReconnect()
        }
      }

      ws.onerror = () => {
        if (!settled) {
          settled = true
          reject(new Error('WebSocket connection failed'))
        }
      }
    })
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null
      try {
        await this.doConnect()
      } catch {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay)
        this.scheduleReconnect()
      }
    }, this.reconnectDelay)
  }

  private flushQueue(): void {
    while (this.queue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg = this.queue.shift()!
      this.ws.send(JSON.stringify(msg))
    }
  }
}
