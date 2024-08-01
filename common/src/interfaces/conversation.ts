/*
 * Copyright (C) 2022 Savoir-faire Linux Inc.
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
import { IContact } from './contact'

export interface IConversationMember {
  role?: ConversationMemberRole
  contact: IContact
}

export type ConversationMemberRole = 'admin' | 'member' | 'invited' | 'banned' | 'left'

export interface Message {
  id: string
  author: string
  timestamp: string
  type:
    | 'application/call-history+json'
    | 'application/data-transfer+json'
    | 'application/update-profile'
    | 'initial'
    | 'member'
    | 'merge'
    | 'text/plain'
    | 'vote'
  linearizedParent: string
  parents: string
  action?: 'add' | 'join' | 'remove' | 'ban' | 'unban'
  body?: string
  duration?: string
  to?: string
  invited?: string
  fileId?: string
}

export interface ConversationInfos {
  avatar?: string
  description?: string
  mode?: string
  title?: string
}

export interface NewConversationRequestBody {
  members: string[]
}

export interface NewMessageRequestBody {
  message: string
}

export interface IConversationSummary {
  id: string
  avatar: ConversationInfos['avatar']
  title: ConversationInfos['title']
  membersNames: string[]
  lastMessage: Message
}

export interface IConversationRequest {
  conversationId: string
  infos: ConversationInfos
  from: IContact
  received: string
  membersNames: string[]
}
