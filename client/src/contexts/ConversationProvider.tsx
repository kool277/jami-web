/*
 * Copyright (C) 2022-2025 Savoir-faire Linux Inc.
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
import {
  ComposingStatus,
  ConversationInfos,
  ConversationMemberEvent,
  ConversationView,
  WebSocketMessageType,
} from 'jami-web-common'
import { useCallback, useEffect, useMemo, useState } from 'react'

import LoadingPage from '../components/Loading'
import { createOptionalContext } from '../hooks/createOptionalContext'
import { useConversationDisplayName } from '../hooks/useConversationDisplayName'
import { useUrlParams } from '../hooks/useUrlParams'
import { ConversationMember } from '../models/conversation-member'
import { ConversationRouteParams } from '../router'
import { useConversationInfosQuery, useMembersQuery } from '../services/conversationQueries'
import { WithChildren } from '../utils/utils'
import { useAuthContext } from './AuthProvider'
import { useWebSocketContext } from './WebSocketProvider'

interface IConversationContext {
  conversationId: string
  conversationDisplayName: string
  conversationInfos: ConversationInfos
  members: ConversationMember[]
  composingMembers: ConversationMember[]
}

const optionalConversationContext = createOptionalContext<IConversationContext>('ConversationContext')
const ConversationContext = optionalConversationContext.Context
export const useConversationContext = optionalConversationContext.useOptionalContext

export default ({ children }: WithChildren) => {
  const {
    urlParams: { conversationId },
  } = useUrlParams<ConversationRouteParams>()
  const { accountId, account } = useAuthContext()
  const webSocket = useWebSocketContext()
  const [composingMembers, setComposingMembers] = useState<ConversationMember[]>([])

  const conversationInfosQuery = useConversationInfosQuery(conversationId!)
  const membersQuery = useMembersQuery(conversationId!)

  const isError = useMemo(
    () => conversationInfosQuery.isError || membersQuery.isError,
    [conversationInfosQuery.isError, membersQuery.isError],
  )

  const isLoading = useMemo(
    () => conversationInfosQuery.isLoading || membersQuery.isLoading,
    [conversationInfosQuery.isLoading, membersQuery.isLoading],
  )

  const conversationInfos = conversationInfosQuery.data
  const members = membersQuery.data

  const filteredMembers = members?.filter((member) => member.contact.uri !== account.getUri())

  const conversationDisplayName = useConversationDisplayName(account, conversationInfos, filteredMembers)

  const onComposingStatusChanged = useCallback(
    (data: ComposingStatus) => {
      // FIXME: data.conversationId is an empty string. Don't know why. Should not be.
      // Good enough for now, but will be a problem if the user has more than one conversation with the same contact.
      // if (data.conversationId === conversationId)
      {
        setComposingMembers((composingMembers) => {
          if (!data.isWriting) {
            return composingMembers.filter(({ contact }) => contact.uri !== data.contactId)
          }

          const isAlreadyIncluded = composingMembers.find((member) => member.contact.uri === data.contactId)
          if (isAlreadyIncluded) {
            return composingMembers
          }

          const member = members?.find((member) => member.contact.uri === data.contactId)
          if (!member) {
            return composingMembers
          }

          return [...composingMembers, member]
        })
      }
    },
    [/*conversationId,*/ members],
  )

  useEffect(() => {
    if (!conversationInfos || !conversationId) {
      return
    }

    const conversationView: ConversationView = {
      conversationId,
    }

    webSocket.send(WebSocketMessageType.ConversationView, conversationView)
    webSocket.bind(WebSocketMessageType.ComposingStatus, onComposingStatusChanged)

    return () => webSocket.unbind(WebSocketMessageType.ComposingStatus, onComposingStatusChanged)
  }, [accountId, conversationInfos, conversationId, onComposingStatusChanged, webSocket])

  useEffect(() => {
    if (!conversationInfos || !conversationId) {
      return
    }

    const conversationMemberEventHandler = (data: ConversationMemberEvent) => {
      if (data.conversationId === conversationId) {
        membersQuery.refetch()
      }
    }

    webSocket.bind(WebSocketMessageType.ConversationMemberEvent, conversationMemberEventHandler)
    return () => webSocket.unbind(WebSocketMessageType.ConversationMemberEvent, conversationMemberEventHandler)
  }, [conversationInfos, conversationId, webSocket, membersQuery])

  const value = useMemo(() => {
    if (!conversationId || !conversationDisplayName || !conversationInfos || !members) {
      return
    }

    return {
      conversationId,
      conversationDisplayName,
      conversationInfos,
      members,
      composingMembers,
    }
  }, [conversationId, conversationDisplayName, conversationInfos, members, composingMembers])

  if (isLoading) {
    return <LoadingPage />
  }
  if (isError || !value) {
    return <div>Error loading conversation: {conversationId}</div>
  }

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>
}
