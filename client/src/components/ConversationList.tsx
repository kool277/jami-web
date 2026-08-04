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
import { Box, Stack } from '@mui/material'
import { WebSocketMessageType } from '@savoirfairelinux/jami-web-common'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useWebSocketContext } from '../contexts/WebSocketProvider.js'
import { useConversationsSummariesQuery, useRefreshConversationsSummaries } from '../services/conversationQueries.js'
import { type ConversationFilter, filterConversationSummaries } from '../utils/conversationFilters.js'
import ListPaneEmptyState from './common/ListPaneEmptyState.js'
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

  const filteredConversations = filterConversationSummaries(conversationsSummaries, conversationFilter)

  if (conversationsSummariesQuery.isSuccess) {
    const emptyState = getEmptyConversationState(
      conversationFilter,
      conversationsSummaries.length,
      filteredConversations.length,
    )
    if (emptyState === 'unread') {
      return <EmptyUnreadConversations />
    }
    if (emptyState === 'groups') {
      return <EmptyGroupsConversations />
    }
    if (emptyState === 'conversations') {
      return <EmptyConversations />
    }
  }

  return <ConversationSummaryList conversationsSummaries={filteredConversations} />
}

export function getEmptyConversationState(
  conversationFilter: ConversationFilter,
  conversationCount: number,
  filteredConversationCount: number,
) {
  if (filteredConversationCount === 0 && (conversationFilter === 'unread' || conversationFilter === 'groups')) {
    return conversationFilter
  }
  if (conversationCount === 0) {
    return 'conversations'
  }
  return undefined
}

export function EmptyConversations() {
  const { t } = useTranslation()

  return (
    <EmptyConversationState
      src="/jami-tumbleweed.svg"
      imageWidth={200}
      title={t('conversation_empty_title')}
      description={t('conversation_empty_description')}
    />
  )
}

export function EmptyUnreadConversations() {
  const { t } = useTranslation()

  return (
    <EmptyConversationState
      src="/no-unread-messages.svg"
      imageWidth={44}
      imageHeight={44}
      title={t('conversation_no_unread_title')}
      description={t('conversation_no_unread_description')}
    />
  )
}

export function EmptyGroupsConversations() {
  const { t } = useTranslation()

  return (
    <EmptyConversationState
      src="/no-groups.svg"
      imageWidth={58}
      imageHeight={58}
      title={t('conversation_no_groups_title')}
      description={t('conversation_no_groups_description')}
    />
  )
}

interface EmptyConversationStateProps {
  src: string
  imageWidth: number
  imageHeight?: number
  title: string
  description: string
}

function EmptyConversationState({ src, imageWidth, imageHeight, title, description }: EmptyConversationStateProps) {
  return (
    <ListPaneEmptyState
      icon={
        <Box
          component="img"
          src={src}
          alt=""
          sx={{
            width: imageWidth,
            height: imageHeight,
            maxWidth: '100%',
            opacity: 0.66,
            filter: (theme) => (theme.palette.mode === 'dark' ? 'invert(1)' : undefined),
          }}
        />
      }
      title={title}
      description={description}
    />
  )
}
