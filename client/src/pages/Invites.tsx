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
import { useTranslation } from 'react-i18next'

import EmptyState from '../components/common/EmptyState.js'
import InviteList from '../components/InviteList.js'
import AppShell from '../components/shell/AppShell.js'
import useDocumentTitle from '../hooks/useDocumentTitle.js'

export default function Invites() {
  const { t } = useTranslation()
  useDocumentTitle(t('invitations'))

  return (
    <AppShell
      listRoute="/invites"
      listPaneLabel={t('invitations')}
      listPane={<InviteList />}
      placeholder={<EmptyState title={t('invitations_select')} />}
    />
  )
}
