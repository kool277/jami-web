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
import LogoutIcon from '@mui/icons-material/Logout'
import { Box, Button, useMediaQuery, useTheme } from '@mui/material'
import { AdminSettingSelection } from 'jami-web-common'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import SettingSidebar from '../SettingSidebar'

//Settings meta structure
interface ISettingItem {
  icon: unknown
  title: string
  highlightKey: string //The string used to determine whether to highlight the title or not.
  link: string
  submenuItems?: ISettingItem[]
}

export default function MainSettingsSelection() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))

  const adminLogout = () => {
    localStorage.removeItem('adminAccessToken')
    navigate('/admin/login')
  }

  const settingMeta: ISettingItem[] = useMemo(() => {
    return [
      {
        icon: null,
        title: t('accounts'),
        highlightKey: 'accounts',
        link: `/admin/${AdminSettingSelection.ACCOUNTS}`,
      },
      {
        icon: null,
        title: t('authentication'),
        highlightKey: 'authentication',
        link: `/admin/${AdminSettingSelection.AUTHENTICATION}`,
      },
      {
        icon: null,
        title: t('admin_account_configuration'),
        highlightKey: 'admin_account_configuration',
        link: `/admin/${AdminSettingSelection.ADMIN_ACCOUNT_CONFIGURATION}`,
      },
    ]
  }, [t])

  return (
    <Box
      sx={{
        height: isMobile ? '95vh' : '2000vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: isMobile ? '100%' : '280px',
      }}
    >
      <Box>
        <SettingSidebar settingMeta={settingMeta} pageTitle={t('admin_page_welcome')} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
        <Button sx={{ width: isMobile ? '50%' : '85%' }} variant="contained" type="submit" onClick={adminLogout}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '80%',
              alignContent: 'center',
              alignItems: 'center',
            }}
          >
            {t('logout')}
            <LogoutIcon sx={{ marginLeft: '10%' }} />
          </Box>
        </Button>
      </Box>
    </Box>
  )
}
