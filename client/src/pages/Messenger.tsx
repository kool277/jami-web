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
import { Stack } from '@mui/material'
import { type ChangeEvent, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ContactSearchBar from '../components/ContactSearchBar.js'
import ConversationFilterChips from '../components/ConversationFilterChips.js'
import ConversationList from '../components/ConversationList.js'
import AppShell from '../components/shell/AppShell.js'
import WelcomePage from '../components/WelcomePage.js'
import useDocumentTitle from '../hooks/useDocumentTitle.js'
import { useConversationsSummariesQuery } from '../services/conversationQueries.js'
import { type ConversationFilter, isConversationUnread } from '../utils/conversationFilters.js'

export default function Messenger() {
  const { t } = useTranslation()
  const conversationsSummariesQuery = useConversationsSummariesQuery()
  useDocumentTitle(t('conversations'))
  const [searchFilter, setSearchFilter] = useState('')
  const [conversationFilter, setConversationFilter] = useState<ConversationFilter>('all')
  const unreadConversationCount = (conversationsSummariesQuery.data || []).filter((conversation) =>
    isConversationUnread(conversation),
  ).length
  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(event.target.value)
  }, [])

  return (
    <AppShell
      listRoute="/conversation"
      listPaneLabel={t('conversations')}
      listSearch={
        <Stack sx={{ gap: 1 }}>
          <ContactSearchBar placeholder={t('find_users_and_conversations')} handleChange={handleSearchChange} />
          <ConversationFilterChips
            value={conversationFilter}
            unreadConversationCount={unreadConversationCount}
            onChange={setConversationFilter}
          />
        </Stack>
      }
      listPane={<ConversationList searchFilter={searchFilter} conversationFilter={conversationFilter} />}
      placeholder={<WelcomePage />}
      immersiveDetail
    />
  )
}
