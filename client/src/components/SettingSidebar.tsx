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
import { Typography } from '@mui/material'
import Collapse from '@mui/material/Collapse'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
// import ListItemIcon from '@mui/material/ListItemIcon';
import Stack from '@mui/material/Stack'
import { Theme } from '@mui/material/styles'
import { useMediaQuery, useTheme } from '@mui/system'
import Box from '@mui/system/Box'
import { useLocation, useNavigate } from 'react-router-dom'

import { useMobileMenuStateContext } from '../contexts/MobileMenuStateProvider'
import { ISettingItem } from '../utils/utils'

interface SettingSidebarProps {
  settingMeta: ISettingItem[]
  pageTitle: string
}

function SettingSidebar({ settingMeta, pageTitle }: SettingSidebarProps) {
  const navigate = useNavigate()
  const theme: Theme = useTheme()
  const { pathname } = useLocation()
  const { setIsMenuOpen } = useMobileMenuStateContext()

  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))

  const isCurrentlyViewing = (text: string) => {
    return pathname.startsWith(text)
  }

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <Typography sx={{ marginLeft: '4%', marginTop: '6%', marginBottom: '2%', fontWeight: 'bolder' }} variant="h6">
          {pageTitle}
        </Typography>
      </Box>
      <Stack direction="row">
        <List sx={{ width: '100%' }}>
          {settingMeta.map((settingItem, index) => (
            <Box key={index}>
              <ListItemButton
                selected={isCurrentlyViewing(settingItem.highlightKey)}
                onClick={() => {
                  navigate(settingItem.link)
                  setIsMenuOpen(false)
                }}
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
              <Collapse
                in={isMobile ? true : isCurrentlyViewing(settingItem.highlightKey)}
                timeout="auto"
                unmountOnExit
              >
                <List component="div" disablePadding>
                  {settingItem.submenuItems?.map((submenuItem, itemIndex) => (
                    <ListItemButton
                      key={itemIndex}
                      sx={{ pl: 4 }}
                      onClick={() => {
                        navigate(submenuItem.link)
                        setIsMenuOpen(false)
                      }}
                    >
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
      </Stack>
    </>
  )
}

export default SettingSidebar
