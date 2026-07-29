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
import { List, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Stack, Typography } from '@mui/material'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useMatch } from 'react-router-dom'

import { AudioCallIcon, DevicesIcon, ManageAccountsIcon, SettingsIcon } from '../../components/SvgIcon.js'
import { userSettingsPath, type UserSettingsRoutePath, userSettingsRoutePaths } from '../routes.js'

interface SettingsNavigationItem {
  icon: ReactNode
  titleKey: string
  path: UserSettingsRoutePath
}

interface SettingsNavigationSection {
  id: string
  titleKey?: string
  items: SettingsNavigationItem[]
}

const sections: SettingsNavigationSection[] = [
  {
    id: 'general',
    items: [{ icon: <SettingsIcon />, titleKey: 'settings_title_general', path: userSettingsRoutePaths.general }],
  },
  {
    id: 'account',
    titleKey: 'settings_title_account',
    items: [
      {
        icon: <ManageAccountsIcon />,
        titleKey: 'settings_manage_account',
        path: userSettingsRoutePaths.manageAccount,
      },
      { icon: <AudioCallIcon />, titleKey: 'settings_calls', path: userSettingsRoutePaths.calls },
      { icon: <DevicesIcon />, titleKey: 'settings_linked_devices', path: userSettingsRoutePaths.linkedDevices },
    ],
  },
]

function SettingsNavigationItem({ icon, titleKey, path }: SettingsNavigationItem) {
  const { t } = useTranslation()
  const to = userSettingsPath(path)
  const selected = useMatch({ path: to, end: true }) !== null

  return (
    <ListItemButton component={NavLink} to={to} end selected={selected}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={t(titleKey)} />
    </ListItemButton>
  )
}

export default function SettingsNavigation() {
  const { t } = useTranslation()

  return (
    <Stack component="nav" aria-label={t('settings')} sx={{ minHeight: 0, overflowY: 'auto', pb: 2 }}>
      <Typography variant="h3" sx={{ px: 2, pt: { xs: 2, md: 1 }, pb: 1 }}>
        {t('settings')}
      </Typography>
      <List disablePadding>
        {sections.map((section) => (
          <li key={section.id}>
            {section.titleKey && (
              <ListSubheader component="h2" disableSticky sx={{ minHeight: 24, lineHeight: '24px' }}>
                {t(section.titleKey)}
              </ListSubheader>
            )}
            <List disablePadding>
              {section.items.map((item) => (
                <SettingsNavigationItem key={item.path} {...item} />
              ))}
            </List>
          </li>
        ))}
      </List>
    </Stack>
  )
}
