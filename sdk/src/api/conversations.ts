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

import type { ConversationInfos, IConversationMember, IConversationSummary, Message } from 'jami-web-common'

import type { HttpClient } from '../http.js'

export class ConversationApi {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<IConversationSummary[]> {
    return this.http.get<IConversationSummary[]>('/conversations')
  }

  async get(conversationId: string): Promise<IConversationSummary> {
    return this.http.get<IConversationSummary>(`/conversations/${encodeURIComponent(conversationId)}`)
  }

  async create(members: string[]): Promise<unknown> {
    return this.http.post('/conversations', { members })
  }

  async remove(conversationId: string): Promise<void> {
    return this.http.delete(`/conversations/${encodeURIComponent(conversationId)}`)
  }

  async getInfos(conversationId: string): Promise<ConversationInfos> {
    return this.http.get<ConversationInfos>(`/conversations/${encodeURIComponent(conversationId)}/infos`)
  }

  async updateInfos(conversationId: string, infos: Partial<ConversationInfos>): Promise<void> {
    return this.http.post(`/conversations/${encodeURIComponent(conversationId)}/infos`, infos)
  }

  async getMembers(conversationId: string): Promise<IConversationMember[]> {
    return this.http.get<IConversationMember[]>(`/conversations/${encodeURIComponent(conversationId)}/members`)
  }

  async addMember(conversationId: string, contactUri: string): Promise<void> {
    return this.http.post(`/conversations/${encodeURIComponent(conversationId)}/add-to-swarm`, {
      contactUri: [contactUri],
    })
  }

  async removeMember(conversationId: string, contactUri: string): Promise<void> {
    return this.http.post(`/conversations/${encodeURIComponent(conversationId)}/remove-from-swarm`, {
      contactUri,
    })
  }

  async getMessages(conversationId: string, options?: { from?: string; limit?: number }): Promise<Message[]> {
    let path = `/conversations/${encodeURIComponent(conversationId)}/messages`
    const params = new URLSearchParams()
    if (options?.from) params.set('from', options.from)
    if (options?.limit) params.set('limit', String(options.limit))
    const qs = params.toString()
    if (qs) path += `?${qs}`
    return this.http.get<Message[]>(path)
  }

  async getMessage(conversationId: string, messageId: string): Promise<Message | undefined> {
    const messages = await this.getMessages(conversationId, { from: messageId, limit: 1 })
    return messages.find((message) => message.id === messageId)
  }

  async sendMessage(conversationId: string, body: string, replyTo?: string): Promise<void> {
    return this.http.post(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
      body,
      replyTo,
    })
  }

  async editMessage(conversationId: string, messageId: string, message: string): Promise<void> {
    return this.http.post(`/conversations/${encodeURIComponent(conversationId)}/editmessage`, {
      message,
      messageId,
    })
  }

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    return this.http.delete(
      `/conversations/delete/${encodeURIComponent(conversationId)}/${encodeURIComponent(messageId)}`,
    )
  }

  async reactToMessage(conversationId: string, messageId: string, emoji: string): Promise<void> {
    return this.http.post(`/conversations/${encodeURIComponent(conversationId)}/reactions`, {
      messageId,
      emoji,
    })
  }

  async getPreferences(conversationId: string): Promise<Record<string, string>> {
    return this.http.get(`/conversations/${encodeURIComponent(conversationId)}/preferences`)
  }

  async setPreferences(conversationId: string, preferences: Record<string, string>): Promise<void> {
    return this.http.post(`/conversations/${encodeURIComponent(conversationId)}/preferences`, preferences)
  }

  async sendFile(conversationId: string, path: string, filename?: string, parentId?: string): Promise<void> {
    return this.http.post(`/conversations/${encodeURIComponent(conversationId)}/files`, {
      path,
      filename,
      parentId,
    })
  }
}
