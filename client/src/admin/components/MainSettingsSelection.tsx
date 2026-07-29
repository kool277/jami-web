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
import { AdminSettingSelection } from '@savoirfairelinux/jami-web-common'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import BaseButton from '../../components/common/BaseButton.js'
import SettingSidebar from '../../components/SettingSidebar.js'
import {
  AdminPanelSettingsIcon,
  BadgeIcon,
  DataThresholdingIcon,
  GppMaybeIcon,
  LiveTvIcon,
  LogoutIcon,
  PeopleIcon,
} from '../../components/SvgIcon.js'
import { AdminConfigurationOptions } from '../../enums/adminConfigurationOptions.js'

//Settings meta structure
interface ISettingItem {
  icon: React.ReactNode
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
        icon: <AdminPanelSettingsIcon />,
        title: t('admin_account_configuration'),
        highlightKey: `/admin/${AdminSettingSelection.CONFIGURATION}`,
        link: `/admin/${AdminSettingSelection.CONFIGURATION}/${AdminConfigurationOptions.ACCOUNT}`,
        submenuItems: [
          {
            icon: <BadgeIcon />,
            title: 'Account',
            highlightKey: `/admin/${AdminSettingSelection.CONFIGURATION}/${AdminConfigurationOptions.ACCOUNT}`,
            link: `/admin/${AdminSettingSelection.CONFIGURATION}/${AdminConfigurationOptions.ACCOUNT}`,
          },
          {
            icon: <DataThresholdingIcon />,
            title: 'Auto Download Limit',
            highlightKey: `/admin/${AdminSettingSelection.CONFIGURATION}/${AdminConfigurationOptions.AUTO_DOWNLOAD_LIMIT}`,
            link: `/admin/${AdminSettingSelection.CONFIGURATION}/${AdminConfigurationOptions.AUTO_DOWNLOAD_LIMIT}`,
          },
          {
            icon: <LiveTvIcon />,
            title: t('media_settings'),
            highlightKey: `/admin/${AdminSettingSelection.CONFIGURATION}/${AdminConfigurationOptions.MEDIA}`,
            link: `/admin/${AdminSettingSelection.CONFIGURATION}/${AdminConfigurationOptions.MEDIA}`,
          },
        ],
      },
      {
        icon: <PeopleIcon />,
        title: t('accounts'),
        highlightKey: `/admin/${AdminSettingSelection.ACCOUNTS}`,
        link: `/admin/${AdminSettingSelection.ACCOUNTS}`,
      },
      {
        icon: <GppMaybeIcon />,
        title: t('authentication'),
        highlightKey: `/admin/${AdminSettingSelection.AUTHENTICATION}`,
        link: `/admin/${AdminSettingSelection.AUTHENTICATION}`,
      },
    ]
  }, [t])

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 2,
        pb: 2,
        width: '100%',
      }}
    >
      <Box>
        <SettingSidebar settingMeta={settingMeta} pageTitle={t('admin_page_welcome')} />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
        <BaseButton sx={{ width: isMobile ? '50%' : '85%' }} variant="contained" type="submit" onClick={adminLogout}>
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
        </BaseButton>
      </Box>
    </Box>
  )
}
