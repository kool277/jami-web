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
import { Typography } from '@mui/material'
import Collapse from '@mui/material/Collapse'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import { Theme } from '@mui/material/styles'
import { useMediaQuery, useTheme } from '@mui/system'
import Box from '@mui/system/Box'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { useMobileMenuStateContext } from '../contexts/MobileMenuStateProvider.js'
import { ISettingItem } from '../utils/utils.js'
import BaseButton from './common/BaseButton.js'
import { ArrowBackIcon, LoginIcon } from './SvgIcon.js'

interface SettingSidebarProps {
  settingMeta: ISettingItem[]
  pageTitle: string
}

function SettingSidebar({ settingMeta, pageTitle }: SettingSidebarProps) {
  const navigate = useNavigate()
  const theme: Theme = useTheme()
  const { pathname } = useLocation()
  const { setIsMenuOpen } = useMobileMenuStateContext()
  const { t } = useTranslation()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))

  const isSettings = pathname.startsWith('/settings')
  const isAdmin = pathname.startsWith('/admin')

  const isCurrentlyViewing = (text: string) => {
    return pathname.startsWith(text)
  }

  const buttonStyle = {
    width: '99%',
    textAlign: 'start',
    margin: '2%',
    backgroundColor: 'transparent',
    color: 'text.primary',
    '&:hover': {
      backgroundColor: 'action.hover',
    },
    height: '36px',
    borderRadius: '12px',
  }

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <Typography
          sx={{ marginLeft: '16px', marginTop: '24px', marginBottom: '8px', fontWeight: 'bolder' }}
          variant="h6"
        >
          {pageTitle}
        </Typography>
      </Box>
      {isSettings && (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <BaseButton
            variant="contained"
            startIcon={<ArrowBackIcon />}
            sx={buttonStyle}
            onClick={() => {
              navigate('/conversation')
              setIsMenuOpen(false)
            }}
          >
            {t('back_to_conversations')}
          </BaseButton>
        </Box>
      )}
      {isAdmin && (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <BaseButton
            variant="contained"
            startIcon={<LoginIcon />}
            sx={buttonStyle}
            onClick={() => {
              navigate('/login')
            }}
          >
            {t('go_to_login_page')}
          </BaseButton>
        </Box>
      )}
      <Stack direction="row">
        <List sx={{ width: '100%' }}>
          {settingMeta.map((settingItem) => {
            const isSettingActive = isCurrentlyViewing(settingItem.highlightKey)

            return (
              <Box key={settingItem.highlightKey}>
                <ListItemButton
                  selected={
                    isSettingActive && !settingItem.submenuItems?.some((item) => isCurrentlyViewing(item.highlightKey))
                  }
                  sx={{
                    backgroundColor: settingItem.submenuItems?.some((item) => isCurrentlyViewing(item.highlightKey))
                      ? `${theme.palette.primary.main}1A`
                      : undefined,
                  }}
                  onClick={() => {
                    navigate(settingItem.link)
                    setIsMenuOpen(false)
                  }}
                >
                  {settingItem.icon && (
                    <ListItemIcon
                      sx={{
                        color:
                          isSettingActive &&
                          !settingItem.submenuItems?.some((item) => isCurrentlyViewing(item.highlightKey))
                            ? theme.palette.primary.dark
                            : theme.palette.text.primary,
                      }}
                    >
                      {settingItem.icon}
                    </ListItemIcon>
                  )}
                  <ListItemText
                    primary={settingItem.title}
                    slotProps={{
                      primary: {
                        sx: {
                          color:
                            isSettingActive &&
                            !settingItem.submenuItems?.some((item) => isCurrentlyViewing(item.highlightKey))
                              ? theme.palette.primary.dark
                              : theme.palette.text.primary,
                          fontWeight:
                            isSettingActive &&
                            !settingItem.submenuItems?.some((item) => isCurrentlyViewing(item.highlightKey))
                              ? 600
                              : 400,
                        },
                      },
                    }}
                  />
                </ListItemButton>
                <Collapse in={isMobile ? true : isSettingActive} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {settingItem.submenuItems?.map((submenuItem) => {
                      const isSubmenuActive = isCurrentlyViewing(submenuItem.highlightKey)

                      return (
                        <ListItemButton
                          key={submenuItem.highlightKey}
                          selected={isSubmenuActive}
                          sx={{
                            pl: 4,
                            ml: 1,
                            mr: 1,
                            backgroundColor: isSubmenuActive ? `${theme.palette.primary.main}1A` : undefined,
                            '&:hover': {
                              backgroundColor: isSubmenuActive
                                ? `${theme.palette.primary.main}1A`
                                : `${theme.palette.primary.main}0D`,
                            },
                          }}
                          onClick={() => {
                            navigate(submenuItem.link)
                            setIsMenuOpen(false)
                          }}
                        >
                          {submenuItem.icon && (
                            <ListItemIcon
                              sx={{
                                color: isSubmenuActive ? theme.palette.primary.dark : theme.palette.text.primary,
                              }}
                            >
                              {submenuItem.icon}
                            </ListItemIcon>
                          )}
                          <ListItemText
                            primary={submenuItem.title}
                            slotProps={{
                              primary: {
                                sx: {
                                  color: isSubmenuActive ? theme.palette.primary.dark : theme.palette.text.primary,
                                  fontWeight: isSubmenuActive ? 700 : 400,
                                },
                              },
                            }}
                          />
                        </ListItemButton>
                      )
                    })}
                  </List>
                </Collapse>
              </Box>
            )
          })}
        </List>
      </Stack>
    </>
  )
}

export default SettingSidebar
