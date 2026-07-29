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
import { Box, Stack, useMediaQuery, useTheme } from '@mui/material'
import { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import MainSettingsSelection from '../components/MainSettingsSelection.js'

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

  return (
    <Stack
      direction={isCompact ? 'column' : 'row'}
      sx={{ height: '100dvh', overflow: isCompact ? 'auto' : 'hidden', backgroundColor: 'background.default' }}
    >
      <Stack
        component="nav"
        aria-label={t('admin_page_welcome')}
        sx={{
          flexShrink: 0,
          ...(isCompact
            ? { borderBottom: 1, borderColor: 'divider' }
            : { width: 360, overflowY: 'auto', borderInlineEnd: 1, borderColor: 'divider' }),
        }}
      >
        <MainSettingsSelection />
      </Stack>
      <Box component="main" sx={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </Box>
    </Stack>
  )
}
