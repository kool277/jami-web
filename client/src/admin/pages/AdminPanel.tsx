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
import { alpha, Box, IconButton, Stack, useMediaQuery, useTheme } from '@mui/material'
import { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useLocation } from 'react-router-dom'

import Island, { ISLAND_MARGIN, ISLAND_PADDING } from '../../components/common/Island.js'
import { ArrowBackIcon } from '../../components/SvgIcon.js'
import AdminSettingsNavigation from '../components/AdminSettingsNavigation.js'

const BACKDROP_LIGHT = './admin/background.jpg'
const BACKDROP_DARK = './admin/background_dark.jpg'

interface AdminPanelProps {
  children: ReactElement
}

/**
 * The admin panel is server-scoped rather than account-scoped, so it keeps its
 * own two-pane layout instead of borrowing the messenger navigation rail.
 */
export default function AdminPanel({ children }: AdminPanelProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isCompact = useMediaQuery(theme.breakpoints.down('md'))
  const { pathname } = useLocation()
  const isDark = theme.palette.mode === 'dark'
  const listRoute = '/admin/settings'
  const hasDetail = pathname !== listRoute
  const navigation = (
    <Stack
      sx={{
        minHeight: 0,
        flexShrink: 0,
        ...(isCompact ? { borderBottom: 1, borderColor: 'divider' } : { flex: 1, width: 320, overflowY: 'auto' }),
      }}
    >
      <AdminSettingsNavigation />
    </Stack>
  )

  return (
    <Stack
      direction={isCompact ? 'column' : 'row'}
      sx={{
        height: '100dvh',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: isCompact ? 'background.paper' : 'background.default',
        ...(!isCompact && {
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: -24,
            backgroundImage: `url(${isDark ? BACKDROP_DARK : BACKDROP_LIGHT})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            filter: 'blur(16px)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundColor: isDark ? alpha(theme.palette.common.black, 0.55) : alpha(theme.palette.common.white, 0.35),
          },
        }),
        '& > *': { position: 'relative', zIndex: 1 },
      }}
    >
      {(!isCompact || !hasDetail) &&
        (isCompact ? navigation : <Island sx={{ m: ISLAND_MARGIN, p: ISLAND_PADDING }}>{navigation}</Island>)}
      {isCompact && hasDetail && (
        <Box sx={{ flexShrink: 0, p: 0.5, borderBottom: 1, borderColor: 'divider' }}>
          <IconButton component={RouterLink} to={listRoute} aria-label={t('back')}>
            <ArrowBackIcon />
          </IconButton>
        </Box>
      )}
      {(!isCompact || hasDetail) && (
        <Box component="main" sx={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' }}>
          {children}
        </Box>
      )}
    </Stack>
  )
}
