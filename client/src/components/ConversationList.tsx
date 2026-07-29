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
import { Stack } from '@mui/material'
import { WebSocketMessageType } from '@savoirfairelinux/jami-web-common'
import { useEffect } from 'react'

import { useAuthContext } from '../contexts/AuthProvider.js'
import { useWebSocketContext } from '../contexts/WebSocketProvider.js'
import { useConversationsSummariesQuery, useRefreshConversationsSummaries } from '../services/conversationQueries.js'
import { type ConversationFilter, filterConversationSummaries } from '../utils/conversationFilters.js'
import ContactSearchResultList from './ContactSearchResultList.js'
import { ConversationSummaryList } from './ConversationSummaryList.js'

export interface ConversationListProps {
  /** Owned by the shell, since the search bar belongs to the island rather than the list. */
  searchFilter?: string
  conversationFilter: ConversationFilter
}

export default function ConversationList({ searchFilter, conversationFilter }: ConversationListProps) {
  return (
    <Stack sx={{ overflowY: 'auto', flex: 1 }}>
      {searchFilter ? (
        <ContactSearchResultList searchFilter={searchFilter} conversationFilter={conversationFilter} />
      ) : (
        <ConversationSummaries conversationFilter={conversationFilter} />
      )}
    </Stack>
  )
}

const ConversationSummaries = ({ conversationFilter }: Pick<ConversationListProps, 'conversationFilter'>) => {
  const { account } = useAuthContext()
  const conversationsSummariesQuery = useConversationsSummariesQuery()
  const conversationsSummaries = conversationsSummariesQuery.data || []
  const websocket = useWebSocketContext()
  const refreshConversationsSummaries = useRefreshConversationsSummaries()

  useEffect(() => {
    websocket.bind(WebSocketMessageType.ConversationMessage, refreshConversationsSummaries)
    websocket.bind(WebSocketMessageType.ConversationReady, refreshConversationsSummaries)
    websocket.bind(WebSocketMessageType.MessageEdition, refreshConversationsSummaries)
    return () => {
      websocket.unbind(WebSocketMessageType.ConversationMessage, refreshConversationsSummaries)
      websocket.unbind(WebSocketMessageType.ConversationReady, refreshConversationsSummaries)
      websocket.unbind(WebSocketMessageType.MessageEdition, refreshConversationsSummaries)
    }
  }, [websocket, refreshConversationsSummaries])

  return (
    <ConversationSummaryList
      conversationsSummaries={filterConversationSummaries(conversationsSummaries, conversationFilter, account.getUri())}
    />
  )
}
