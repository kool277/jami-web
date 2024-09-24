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
import { Box, Typography, useMediaQuery } from '@mui/material'
import { Theme, useTheme } from '@mui/material/styles'
import { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import MainSettingsSelection from '../components/AdminSettings/MainSettingsSelection'

interface AdminPanelProps {
  children: ReactElement
}

export default function AdminPanel({ children }: AdminPanelProps) {
  const { t } = useTranslation()
  const theme: Theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
        <Typography variant={isMobile ? 'h3' : 'h2'} sx={{ mt: '1%' }}>
          {t('admin_page_welcome')}
        </Typography>
      </Box>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          textAlign: isMobile ? 'center' : 'inherit',
        }}
      >
        <Box sx={{ height: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
          <MainSettingsSelection />
        </Box>
        <Box
          sx={{
            width: '80vw',
            display: 'flex',
            flexDirection: 'rorw',
            justifyContent: 'center',
            textAlign: 'center',
            alignContent: 'center',
            alignItems: 'center',
          }}
        >
          {children}
        </Box>
      </div>
    </>
  )
}
