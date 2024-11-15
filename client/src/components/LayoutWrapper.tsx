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
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { useMobileMenuStateContext } from '../contexts/MobileMenuStateProvider'
import Footer from './Footer'

interface LayoutWrapperProps {
  sidebar: ReactNode
  main: ReactNode
}

export default function LayoutWrapper({ sidebar, main }: LayoutWrapperProps) {
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const { isMenuOpen, setIsMenuOpen } = useMobileMenuStateContext()
  const location = useLocation()
  const isSettings = location.pathname.startsWith('/settings') || location.pathname.startsWith('/contacts')
  const isAdminPanel = location.pathname.startsWith('/admin')

  const sidebarStyles = {
    width: '300px',
    top: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100vh',
    overflow: 'scroll',
    bgcolor: theme.ChatInterface.panelColor,
  }

  const sidebarStylesMobile = {
    ...sidebarStyles,
    overflow: 'hidden',
    width: isMenuOpen ? '100%' : '0px',
    transition: 'width 0.3s',
    zIndex: 99,
  }

  const mainWindowStyles = {
    height: isSettings ? 'auto' : '100vh',
    width: '100%',
    overflow: 'hidden',
  }

  const mainWindowStylesMobile = {
    width: isMobile && !isMenuOpen ? '100%' : '0px',
    transition: 'width 0.3s',
    overflow: 'auto',
    height: '100vh',
  }

  const footerStyles = {
    width: isMobile && !isMenuOpen ? '0px' : 'auto',
    visibility: isMobile && !isMenuOpen ? 'hidden' : 'visible',
  }

  const doNotDisplayStyles = { visibility: 'hidden', width: '0px', height: '0px' }

  return (
    <Box display={'flex'}>
      <Box sx={isMobile ? sidebarStylesMobile : sidebarStyles}>
        <Box sx={{ overflow: 'hidden' }}>{sidebar}</Box>
        {!isAdminPanel && (
          <Box sx={footerStyles}>
            <Footer />
          </Box>
        )}
      </Box>

      <Box
        sx={
          isMenuOpen
            ? doNotDisplayStyles
            : {
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                width: isMobile ? '100%' : 'unset',
                height: '100vh',
                padding: isSettings ? '3%' : 'unset',
              }
        }
      >
        <MenuOpenIcon
          sx={!isMenuOpen && isMobile ? { '&:hover': { cursor: 'pointer' } } : doNotDisplayStyles}
          onClick={() => {
            setIsMenuOpen(true)
          }}
        />
        <Box sx={isMobile ? mainWindowStylesMobile : mainWindowStyles}>{main}</Box>
      </Box>
    </Box>
  )
}
