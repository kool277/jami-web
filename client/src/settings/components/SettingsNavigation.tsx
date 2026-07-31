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
import {
  ButtonBase,
  Collapse,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  Typography,
} from '@mui/material'
import type { ComponentType, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'

import {
  AudioCallIcon,
  ChatBubbleIcon,
  DevicesIcon,
  ManageAccountsIcon,
  SettingsIcon,
  type SymbolIconProps,
} from '../../components/SvgIcon.js'
import { isRoutePathActive } from '../../utils/routes.js'
import { userSettingsPath, type UserSettingsRoutePath, userSettingsRoutePaths } from '../routes.js'

interface SettingsNavigationItem {
  icon?: ReactNode
  titleKey: string
  path: UserSettingsRoutePath
}

interface SettingsNavigationSection {
  id: string
  titleKey?: string
  icon?: ComponentType<SymbolIconProps>
  items: SettingsNavigationItem[]
}

const sections: SettingsNavigationSection[] = [
  {
    id: 'general',
    titleKey: 'settings_title_general',
    icon: SettingsIcon,
    items: [
      { icon: <SettingsIcon />, titleKey: 'settings_title_system', path: userSettingsRoutePaths.generalSystem },
      { icon: <SettingsIcon />, titleKey: 'settings_appearance', path: userSettingsRoutePaths.generalAppearance },
      { icon: <ChatBubbleIcon />, titleKey: 'settings_title_chat', path: userSettingsRoutePaths.generalChat },
    ],
  },
  {
    id: 'account',
    titleKey: 'settings_title_account',
    icon: ManageAccountsIcon,
    items: [
      {
        icon: <ManageAccountsIcon />,
        titleKey: 'settings_manage_account',
        path: userSettingsRoutePaths.manageAccount,
      },
      {
        titleKey: 'settings_customize_profile',
        path: userSettingsRoutePaths.customizeProfile,
      },
      {
        titleKey: 'passkey_section_title',
        path: userSettingsRoutePaths.passkeys,
      },
      { icon: <AudioCallIcon />, titleKey: 'settings_calls', path: userSettingsRoutePaths.calls },
      { icon: <DevicesIcon />, titleKey: 'settings_linked_devices', path: userSettingsRoutePaths.linkedDevices },
    ],
  },
]

function SettingsNavigationItem({ icon, titleKey, path }: SettingsNavigationItem) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const to = userSettingsPath(path)
  const selected = isRoutePathActive(pathname, to)

  return (
    <ListItemButton
      component={NavLink}
      to={to}
      aria-current={selected ? 'page' : undefined}
      sx={{
        minHeight: 32,
        py: 0,
        color: selected ? 'primary.dark' : 'text.primary',
        transition: (theme) => theme.transitions.create('color'),
      }}
    >
      {icon && <ListItemIcon>{icon}</ListItemIcon>}
      <ListItemText
        primary={t(titleKey)}
        slotProps={{ primary: { variant: 'body2', sx: { fontWeight: selected ? 500 : 400 } } }}
      />
    </ListItemButton>
  )
}

export default function SettingsNavigation() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const activeSectionId = sections.find((section) =>
    section.items.some((item) => isRoutePathActive(pathname, userSettingsPath(item.path))),
  )?.id

  return (
    <Stack component="nav" aria-label={t('settings')} sx={{ minHeight: 0, overflowY: 'auto', pb: 2 }}>
      <Typography variant="h3" sx={{ px: 2, pt: { xs: 2, md: 1 }, pb: 1 }}>
        {t('settings')}
      </Typography>
      <List disablePadding>
        {sections.map((section) => {
          const isSelected = activeSectionId === section.id
          const selectedItemIndex = section.items.findIndex((item) =>
            isRoutePathActive(pathname, userSettingsPath(item.path)),
          )
          const SectionIcon = section.icon

          return (
            <li key={section.id}>
              {section.titleKey && (
                <ListSubheader component="h2" disableSticky sx={{ minHeight: 48, lineHeight: '48px' }}>
                  <ButtonBase
                    component={NavLink}
                    to={userSettingsPath(section.items[0].path)}
                    aria-pressed={isSelected}
                    sx={{
                      width: '100%',
                      minHeight: 48,
                      justifyContent: 'flex-start',
                      gap: 1,
                      px: 1,
                      borderRadius: '9999px',
                      typography: 'body1',
                      fontWeight: 500,
                      color: isSelected ? 'primary.dark' : 'text.secondary',
                      backgroundColor: isSelected ? 'primary.light' : 'transparent',
                    }}
                  >
                    {SectionIcon && <SectionIcon filled={isSelected} />}
                    {t(section.titleKey)}
                  </ButtonBase>
                </ListSubheader>
              )}
              <Collapse in={isSelected} timeout="auto" unmountOnExit>
                <List
                  disablePadding
                  sx={
                    section.titleKey
                      ? {
                          ml: 3.5,
                          pl: 1,
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: -1,
                            width: 3,
                            borderRadius: 999,
                            backgroundColor: 'divider',
                          },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: `${Math.max(selectedItemIndex, 0) * 32}px`,
                            left: -1,
                            width: 3,
                            height: 32,
                            opacity: selectedItemIndex === -1 ? 0 : 1,
                            borderRadius: 999,
                            backgroundColor: 'primary.main',
                            transition: (theme) => theme.transitions.create(['top', 'opacity']),
                          },
                        }
                      : undefined
                  }
                >
                  {section.items.map((item) => (
                    <SettingsNavigationItem key={item.path} {...item} icon={null} />
                  ))}
                </List>
              </Collapse>
            </li>
          )
        })}
      </List>
    </Stack>
  )
}
