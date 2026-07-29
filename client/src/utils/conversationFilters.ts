/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
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
import { IConversationSummary, Message } from '@savoirfairelinux/jami-web-common'
import { MessageStatusCode } from '@savoirfairelinux/jami-web-common/src/enums/message-status-code'

export type ConversationFilter = 'all' | 'unread' | 'groups'

const readStatusFor = (message: Message, accountUri: string) => {
  if (message.status instanceof Map) {
    return message.status.get(accountUri)
  }

  return (message.status as unknown as Record<string, MessageStatusCode>)[accountUri]
}

export const isConversationUnread = (conversation: IConversationSummary, accountUri: string) => {
  const message = conversation.lastMessage
  return Boolean(
    message && message.author !== accountUri && readStatusFor(message, accountUri) !== MessageStatusCode.read,
  )
}

export const filterConversationSummaries = (
  conversations: IConversationSummary[],
  filter: ConversationFilter,
  accountUri: string,
) => {
  switch (filter) {
    case 'unread':
      return conversations.filter((conversation) => isConversationUnread(conversation, accountUri))
    case 'groups':
      return conversations.filter((conversation) => conversation.mode !== '0')
    default:
      return conversations
  }
}
