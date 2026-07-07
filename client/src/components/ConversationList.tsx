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
import { ChangeEvent, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useWebSocketContext } from '../contexts/WebSocketProvider.js'
import {
  useConversationRequestsQuery,
  useConversationsSummariesQuery,
  useRefreshConversationsSummaries,
} from '../services/conversationQueries.js'
import ContactSearchBar from './ContactSearchBar.js'
import ContactSearchResultList from './ContactSearchResultList.js'
import { ConversationRequestList } from './ConversationRequestList.js'
import { ConversationSummaryList } from './ConversationSummaryList.js'
import { Tab, TabPanel, TabPanelProps, Tabs } from './Tabs.js'

export default function ConversationList() {
  const { t } = useTranslation()
  const [searchFilter, setSearchFilter] = useState('')
  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(event.target.value)
  }, [])
  return (
    <>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 99,
          overflow: 'hidden',
        }}
      >
        <ContactSearchBar placeholder={t('find_users_and_conversations')} handleChange={handleInputChange} />
      </Box>

      <Stack sx={{ overflowY: 'auto', height: '100%', paddingBottom: '100px' }}>
        {searchFilter ? <ContactSearchResultList searchFilter={searchFilter} /> : <ConversationTabs />}
      </Stack>
    </>
  )
}

const ConversationTabs = () => {
  const summariesTabIndex = 0
  const invitationsTabIndex = 1
  const { t } = useTranslation()
  const conversationRequestsQuery = useConversationRequestsQuery()
  const conversationRequestsLength = conversationRequestsQuery.data?.length

  const isShowingTabMenu = !!conversationRequestsLength
  const [tabIndex, setTabIndex] = useState(summariesTabIndex)
  const visibleTabIndex = isShowingTabMenu ? tabIndex : summariesTabIndex

  const onChange = useCallback((_event: React.SyntheticEvent, value: number) => {
    if (typeof value === 'number') {
      setTabIndex(value)
    }
  }, [])

  return (
    <Box style={{ overflowY: 'auto' }}>
      {isShowingTabMenu && (
        <Tabs value={visibleTabIndex} onChange={onChange}>
          <Tab label={t('conversations')} />
          <Tab label={`${t('invitations')} ${conversationRequestsLength}`} />
        </Tabs>
      )}
      <SummariesTabPanel index={summariesTabIndex} value={visibleTabIndex} />
      <InvitationsTabPanel index={invitationsTabIndex} value={visibleTabIndex} />
    </Box>
  )
}

const SummariesTabPanel = (props: TabPanelProps) => {
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
    <TabPanel sx={{ overflowY: 'auto', height: '100%' }} {...props}>
      <ConversationSummaryList conversationsSummaries={conversationsSummaries} />
    </TabPanel>
  )
}

const InvitationsTabPanel = (props: TabPanelProps) => {
  return (
    <TabPanel {...props}>
      <ConversationRequestList />
    </TabPanel>
  )
}
