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
import Collapse from '@mui/material/Collapse'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
// import ListItemIcon from '@mui/material/ListItemIcon';
import Stack from '@mui/material/Stack'
import { Theme } from '@mui/material/styles'
import { useTheme } from '@mui/system'
import Box from '@mui/system/Box'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

//Settings meta structure
interface ISettingItem {
  icon: unknown
  title: string
  highlightKey: string //The string used to determine whether to highlight the title or not.
  link: string
  submenuItems?: ISettingItem[]
}

function SettingSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const theme: Theme = useTheme()
  const { pathname } = useLocation()

  const isCurrentlyViewing = (text: string) => {
    return pathname.includes(text)
  }

  const settingMeta: ISettingItem[] = useMemo(() => {
    return [
      {
        icon: null,
        title: t('settings_title_account'),
        highlightKey: 'account',
        link: '/settings/account/manage-account',
        submenuItems: [
          {
            highlightKey: 'manage-account',
            icon: null,
            title: t('settings_manage_account'),
            link: '/settings/account/manage-account',
          },
          {
            highlightKey: 'customize-profile',
            icon: null,
            title: t('settings_customize_profile'),
            link: '/settings/account/customize-profile',
          },
          {
            highlightKey: 'linked-devices',
            icon: null,
            title: t('settings_linked_devices'),
            link: '/settings/account/linked-devices',
          },
        ],
      },
      {
        icon: null,
        title: t('settings_title_general'),
        highlightKey: 'general',
        link: '/settings/general/system',
        submenuItems: [
          {
            highlightKey: 'system',
            icon: null,
            title: t('settings_title_system'),
            link: '/settings/general/system',
          },
          {
            highlightKey: 'appearance',
            icon: null,
            title: t('settings_appearance'),
            link: '/settings/general/appearance',
          },
        ],
      },
    ]
  }, [t])

  return (
    <Stack direction="row">
      <List sx={{ width: '300px' }}>
        {settingMeta.map((settingItem, index) => (
          <Box key={index}>
            <ListItemButton
              selected={isCurrentlyViewing(settingItem.highlightKey)}
              onClick={() => navigate(settingItem.link)}
            >
              {/* TODO: add icons */}
              {/* <ListItemIcon>
                                {/* <InboxIcon /> */}
              {/* </ListItemIcon> */}
              <ListItemText
                primaryTypographyProps={{
                  color: isCurrentlyViewing(settingItem.highlightKey)
                    ? theme.palette.primary.dark
                    : theme.palette.text.primary,
                }}
                primary={settingItem.title}
              />
            </ListItemButton>
            <Collapse in={isCurrentlyViewing(settingItem.highlightKey)} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {settingItem.submenuItems &&
                  settingItem.submenuItems.map((submenuItem, itemIndex) => (
                    <ListItemButton key={itemIndex} sx={{ pl: 4 }} onClick={() => navigate(submenuItem.link)}>
                      <ListItemText
                        primaryTypographyProps={{
                          color: isCurrentlyViewing(submenuItem.highlightKey)
                            ? theme.palette.primary.dark
                            : theme.palette.text.primary,
                        }}
                        primary={submenuItem.title}
                      />
                    </ListItemButton>
                  ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </List>
      <Outlet />
    </Stack>
  )
}

export default SettingSidebar
