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
import { Box, Button, Typography, useMediaQuery } from '@mui/material'
import { Theme, useTheme } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import AuthMethods from '../components/AdminSettings/AuthMethods'
import jamiLogoIcon from '../icons/jamiLogoIcon.svg'
export default function AdminPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const adminLogout = () => {
    localStorage.removeItem('adminAccessToken')
    navigate('/admin/login')
  }
  const theme: Theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: isMobile ? 'center' : 'space-between',
          flexWrap: 'wrap',
          textAlign: isMobile ? 'center' : 'inherit',
        }}
      >
        <Box
          component="img"
          sx={{
            height: 'auto',
            width: 150,
            maxHeight: { xs: 0, md: 100 },
            maxWidth: { xs: 0, md: 150 },
          }}
          alt="Logo Savoir Faire Linux"
          src={jamiLogoIcon}
        />
        <Typography variant={isMobile ? 'h3' : 'h2'} sx={{ mt: '1%' }}>
          {t('admin_page_welcome')}
        </Typography>
        {isMobile ? null : (
          <Button variant="contained" type="submit" onClick={adminLogout} sx={{ margin: '0.5%', mt: '1.5%' }}>
            {t('logout')}
          </Button>
        )}
      </div>
      <AuthMethods />
      {isMobile ? (
        <div>
          <Button variant="contained" type="submit" onClick={adminLogout} sx={{ margin: '1%' }}>
            {t('logout')}
          </Button>
        </div>
      ) : null}
    </>
  )
}
