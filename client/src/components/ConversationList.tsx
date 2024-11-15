/*
 * Copyright (C) 2022-2024 Savoir-faire Linux Inc.
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
import { Box, Stack, Typography, useTheme } from '@mui/material'
import { ChangeEvent, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useConversationRequestsQuery, useConversationsSummariesQuery } from '../services/conversationQueries'
import ContactSearchBar from './ContactSearchBar'
import ContactSearchResultList from './ContactSearchResultList'
import { ConversationRequestList } from './ConversationRequestList'
import { ConversationSummaryList } from './ConversationSummaryList'
import { Tab, TabPanel, TabPanelProps, Tabs, TabsList, TabsProps } from './Tabs'

export default function ConversationList() {
  const { t } = useTranslation()
  const [searchFilter, setSearchFilter] = useState('')
  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(event.target.value)
  }, [])
  const theme = useTheme()

  return (
    <>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 99,
          backgroundColor: theme.ChatInterface.panelColor,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex' }}>
          <Typography
            sx={{ marginLeft: '16px', marginTop: '24px', marginBottom: '8px', fontWeight: 'bolder' }}
            variant="h6"
          >
            {t('conversations')}
          </Typography>
        </Box>
        <ContactSearchBar placeholder={t('find_users_and_conversations')} handleChange={handleInputChange} />
      </Box>

      <Stack sx={{ overflow: 'scroll', height: '100%', paddingBottom: '100px' }}>
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

  const [isShowingTabMenu, setIsShowingTabMenu] = useState(false)
  const [tabIndex, setTabIndex] = useState(summariesTabIndex)

  useEffect(() => {
    const newIsShowingTabMenu = !!conversationRequestsLength
    setIsShowingTabMenu(newIsShowingTabMenu)
    if (!newIsShowingTabMenu) {
      setTabIndex(summariesTabIndex)
    }
  }, [conversationRequestsLength])

  const onChange = useCallback<NonNullable<TabsProps['onChange']>>((_event, value) => {
    if (typeof value === 'number') {
      setTabIndex(value)
    }
  }, [])

  return (
    <Tabs style={{ overflow: 'scroll' }} defaultValue={summariesTabIndex} value={tabIndex} onChange={onChange}>
      {isShowingTabMenu && (
        <TabsList>
          <Tab>{t('conversations')}</Tab>
          <Tab>
            {t('invitations')} {conversationRequestsLength}
          </Tab>
        </TabsList>
      )}
      <SummariesTabPanel value={summariesTabIndex} />
      <InvitationsTabPanel value={invitationsTabIndex} />
    </Tabs>
  )
}

const SummariesTabPanel = (props: TabPanelProps) => {
  const conversationsSummariesQuery = useConversationsSummariesQuery()
  const conversationsSummaries = conversationsSummariesQuery.data || []

  return (
    <TabPanel sx={{ overflow: 'scroll', height: '100%' }} {...props}>
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
