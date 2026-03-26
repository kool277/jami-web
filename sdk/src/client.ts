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

import type { AccessToken, ConversationMessage, IConversationRequest } from 'jami-web-common'
import { WebSocketMessageType } from 'jami-web-common'

import { AccountApi } from './api/account.js'
import { CallApi } from './api/calls.js'
import { ContactApi } from './api/contacts.js'
import { ConversationRequestApi } from './api/conversation-requests.js'
import { ConversationApi } from './api/conversations.js'
import { DataTransferApi } from './api/data-transfer.js'
import { TokenApi } from './api/tokens.js'
import { HttpClient } from './http.js'
import { EventClient } from './realtime/event-client.js'

export interface TokenAuthOptions {
  server: string
  token: string
}

export interface CredentialAuthOptions {
  server: string
  credentials: {
    username: string
    password: string
    authMethod?: 'local' | 'jams'
  }
}

export type JamiClientOptions = TokenAuthOptions | CredentialAuthOptions

/** High-level event map for JamiClient.on() */
export interface JamiEventMap {
  message: ConversationMessage
  conversationRequest: IConversationRequest
}

function isTokenAuth(opts: JamiClientOptions): opts is TokenAuthOptions {
  return 'token' in opts
}

const eventToWsType: { [K in keyof JamiEventMap]: WebSocketMessageType } = {
  message: WebSocketMessageType.ConversationMessage,
  conversationRequest: WebSocketMessageType.ConversationRequest,
}

export class JamiClient {
  private readonly http: HttpClient
  readonly server: string
  private token: string | undefined

  readonly account: AccountApi
  readonly conversations: ConversationApi
  readonly contacts: ContactApi
  readonly calls: CallApi
  readonly dataTransfer: DataTransferApi
  readonly tokens: TokenApi
  readonly conversationRequests: ConversationRequestApi
  readonly events: EventClient

  constructor(options: JamiClientOptions) {
    this.server = options.server.replace(/\/+$/, '')

    if (isTokenAuth(options)) {
      this.token = options.token
    }

    this.http = new HttpClient({
      baseUrl: `${this.server}/api`,
      getToken: () => this.getToken(options),
    })

    this.account = new AccountApi(this.http)
    this.conversations = new ConversationApi(this.http)
    this.contacts = new ContactApi(this.http)
    this.calls = new CallApi(this.http)
    this.dataTransfer = new DataTransferApi(this.http)
    this.tokens = new TokenApi(this.http)
    this.conversationRequests = new ConversationRequestApi(this.http)
    this.events = new EventClient(this.server, () => this.getToken(options))
  }

  /** Subscribe to high-level client events. Returns an unsubscribe function. */
  on<K extends keyof JamiEventMap>(event: K, handler: (data: JamiEventMap[K]) => void): () => void {
    const wsType = eventToWsType[event]
    return this.events.on(wsType, handler as any)
  }

  /** Connect the realtime event stream (WebSocket). */
  async connect(): Promise<void> {
    return this.events.connect()
  }

  /** Disconnect the realtime event stream. */
  disconnect(): void {
    this.events.disconnect()
  }

  private async getToken(options: JamiClientOptions): Promise<string> {
    if (this.token) {
      return this.token
    }

    if (!isTokenAuth(options)) {
      const { credentials } = options
      const res = await fetch(`${this.server}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
          authMethod: credentials.authMethod ?? 'local',
        }),
      })
      if (!res.ok) {
        throw new Error(`Authentication failed: ${res.status} ${await res.text()}`)
      }
      const data = (await res.json()) as AccessToken
      this.token = data.accessToken
      return this.token
    }

    throw new Error('No authentication token available')
  }
}
