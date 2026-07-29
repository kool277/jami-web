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
import { type ChangeEvent, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import ContactSearchBar from '../components/ContactSearchBar.js'
import ConversationList from '../components/ConversationList.js'
import AppShell from '../components/shell/AppShell.js'
import WelcomePage from '../components/WelcomePage.js'
import useDocumentTitle from '../hooks/useDocumentTitle.js'

export default function Messenger() {
  const { t } = useTranslation()
  useDocumentTitle(t('conversations'))
  const [searchFilter, setSearchFilter] = useState('')
  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(event.target.value)
  }, [])

  return (
    <AppShell
      listRoute="/conversation"
      listPaneLabel={t('conversations')}
      listSearch={
        <ContactSearchBar placeholder={t('find_users_and_conversations')} handleChange={handleSearchChange} />
      }
      listPane={<ConversationList searchFilter={searchFilter} />}
      placeholder={<WelcomePage />}
      immersiveDetail
    />
  )
}
