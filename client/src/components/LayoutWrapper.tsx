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
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { alpha, darken, lighten } from '@mui/material/styles'
import { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAppBackgroundContext } from '../contexts/AppBackgroundProvider.js'
import { useMobileMenuStateContext } from '../contexts/MobileMenuStateProvider.js'
import { isElectronMode } from '../utils/electron.js'
import Footer from './Footer.js'
import { ArrowBackIosNewIcon } from './SvgIcon.js'

interface LayoutWrapperProps {
  sidebar: ReactNode
  main: ReactNode
}

export default function LayoutWrapper({ sidebar, main }: LayoutWrapperProps) {
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const { isMenuOpen, setIsMenuOpen } = useMobileMenuStateContext()
  const { tintColor } = useAppBackgroundContext()
  const location = useLocation()
  const isSettings = location.pathname.startsWith('/settings') || location.pathname.startsWith('/contacts')
  const isAdminPanel = location.pathname.startsWith('/admin')
  const navigate = useNavigate()
  const isDark = theme.palette.mode === 'dark'
  const bgImage = isDark ? './admin/background_dark.jpg' : './admin/background.jpg'

  const electron = isElectronMode()

  const sidebarStyles = {
    width: '300px',
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 'calc(100vh - 16px)',
    bgcolor: alpha(theme.ChatInterface.panelColor, 0.85),
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    m: '8px',
    mr: 0,
    borderRadius: theme.Panel.borderRadius,
    boxShadow: theme.Panel.shadow,
    overflow: 'hidden',
    zIndex: 10,
    position: 'relative',
  }

  const sidebarStylesMobile = {
    ...sidebarStyles,
    width: isMenuOpen ? 'calc(100% - 16px)' : '0px',
    minWidth: isMenuOpen ? 'calc(100% - 16px)' : '0px',
    m: isMenuOpen ? '8px' : 0,
    height: isMenuOpen ? 'calc(100vh - 16px)' : '100vh',
    transition: 'width 0.3s, min-width 0.3s, margin 0.3s, height 0.3s',
    zIndex: 99,
  }

  const mainWindowStyles = {
    height: '100%',
    width: '100%',
    overflowY: isSettings || isAdminPanel ? 'scroll' : 'hidden',
  }

  const mainWindowStylesMobile = {
    width: isMobile && !isMenuOpen ? '100%' : '0px',
    transition: 'width 0.3s',
    overflow: 'auto',
    height: '100%',
  }

  // Main panel is the app surface itself — no separate card/shadow
  const mainPanelStyles = {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    width: isMobile ? '100%' : 'unset',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  }

  const mainPanelStylesMobile = {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    width: isMobile ? '100%' : 'unset',
    height: isMenuOpen ? '0px' : '100vh',
    overflow: 'hidden',
    transition: 'height 0.3s',
    zIndex: 1,
    position: 'relative',
  }

  const footerStyles = {
    width: isMobile && !isMenuOpen ? '0px' : 'auto',
    visibility: isMobile && !isMenuOpen ? 'hidden' : 'visible',
  }

  const doNotDisplayStyles = { visibility: 'hidden', width: '0px', height: '0px' }

  if (!isMobile) {
    setIsMenuOpen(false)
  }

  const onMenuIconClick = () => {
    if (isMobile) {
      setIsMenuOpen(true)
    }
    if (location.pathname.startsWith('/conversation')) {
      navigate('/conversation')
    }
  }

  const isConversationOpen = location.pathname.startsWith('/conversation') && !isMenuOpen

  const overlayBg = tintColor ? (isDark ? darken(tintColor, 0.85) : lighten(tintColor, 0.85)) : 'transparent'
  const overlayVisible = tintColor !== null

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        ...(electron && { WebkitAppRegion: 'drag' }),
        position: 'relative',
      }}
    >
      {/* Background image layer — blurred with a dark/light scrim */}
      <Box
        sx={{
          position: 'absolute',
          inset: '-20px',
          backgroundImage: `url(${bgImage})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          filter: 'blur(16px)',
          zIndex: 0,
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.35)',
          },
        }}
      />
      {/* Tint color overlay — fades in/out via opacity */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: overlayBg,
          opacity: overlayVisible ? 1 : 0,
          transition: 'opacity 0.6s ease-in-out, background 0.6s ease-in-out',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Box
        sx={{ ...(isMobile ? sidebarStylesMobile : sidebarStyles), ...(electron && { WebkitAppRegion: 'no-drag' }) }}
      >
        {/* Invisible drag strip at top of sidebar (electron only): lets user drag the
            window from the empty area above the search bar. On macOS this also
            clears space for the native traffic-light buttons (minimize/maximize/close). */}
        {electron && (
          <Box
            sx={{
              height: '36px',
              flexShrink: 0,
              WebkitAppRegion: 'drag',
            }}
          />
        )}
        <Box sx={{ overflow: 'hidden', flex: 1, minHeight: 0 }}>{sidebar}</Box>
        {!isAdminPanel && (
          <Box sx={footerStyles}>
            <Footer />
          </Box>
        )}
      </Box>
      <Box
        sx={{
          ...(isMobile ? mainPanelStylesMobile : mainPanelStyles),
          ...(electron && { WebkitAppRegion: 'no-drag' }),
        }}
      >
        {!isConversationOpen && (
          <ArrowBackIosNewIcon
            sx={!isMenuOpen && isMobile ? { '&:hover': { cursor: 'pointer' }, margin: '16px' } : doNotDisplayStyles}
            onClick={() => {
              onMenuIconClick()
            }}
          />
        )}
        <Box sx={isMobile ? mainWindowStylesMobile : mainWindowStyles}>{main}</Box>
      </Box>
    </Box>
  )
}
