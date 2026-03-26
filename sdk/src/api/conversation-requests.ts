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

import type { IConversationRequest, IConversationSummary } from 'jami-web-common'

import type { HttpClient } from '../http.js'

export class ConversationRequestApi {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<IConversationRequest[]> {
    return this.http.get<IConversationRequest[]>('/conversation-requests')
  }

  async accept(conversationId: string): Promise<IConversationSummary> {
    return this.http.post<IConversationSummary>(`/conversation-requests/${encodeURIComponent(conversationId)}`)
  }

  async decline(conversationId: string): Promise<void> {
    return this.http.delete(`/conversation-requests/${encodeURIComponent(conversationId)}`)
  }

  async block(conversationId: string): Promise<void> {
    return this.http.post(`/conversation-requests/${encodeURIComponent(conversationId)}/block`)
  }
}
