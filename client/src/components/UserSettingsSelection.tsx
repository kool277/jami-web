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
import { Box } from '@mui/material'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { ISettingItem } from '../utils/utils'
import SettingSidebar from './SettingSidebar'

function UserSettingsSelection() {
  const { t } = useTranslation()

  const settingMeta: ISettingItem[] = useMemo(() => {
    return [
      {
        icon: null,
        title: t('settings_title_account'),
        highlightKey: '/settings/account',
        link: '/settings/account/manage-account',
        submenuItems: [
          {
            highlightKey: '/settings/account/manage-account',
            icon: null,
            title: t('settings_manage_account'),
            link: '/settings/account/manage-account',
          },
          {
            highlightKey: '/settings/account/linked-devices',
            icon: null,
            title: t('settings_linked_devices'),
            link: '/settings/account/linked-devices',
          },
        ],
      },
      {
        icon: null,
        title: t('settings_title_general'),
        highlightKey: '/settings/general',
        link: '/settings/general',
      },
    ]
  }, [t])

  return (
    <Box sx={{ minWidth: '300px', width: '100%' }}>
      <SettingSidebar settingMeta={settingMeta} pageTitle={t('settings')} />
    </Box>
  )
}

export default UserSettingsSelection
