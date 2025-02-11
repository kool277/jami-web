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
import { Box, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'

import LayoutSettings from '../LayoutSettings'
import { SettingsGroup } from '../Settings'
import SettingLanguage from './SettingLanguage'
import SettingLinkPreview from './SettingLinkPreview'
import SettingNotifications from './SettingNotifications'
import SettingTheme from './SettingTheme'
import SettingTips from './SettingTips'

function System() {
  const { t } = useTranslation()

  const marginValue = '10px'
  const style = { mt: marginValue, mb: marginValue }

  return (
    <LayoutSettings title={t('general_settings')} disableMarginTop={true}>
      <Stack
        sx={{
          padding: '3%',
        }}
      >
        <SettingsGroup label={t('settings_title_system')}>
          <Box sx={style}>
            <SettingLanguage />
          </Box>
          <Box sx={style}>
            <SettingNotifications />
          </Box>
          <Box sx={style}>
            <SettingTheme />
          </Box>
          <SettingTips />
          <Box sx={style}></Box>
        </SettingsGroup>
        <SettingsGroup label={t('settings_title_chat')}>
          <Box sx={style}>
            <SettingLinkPreview />
          </Box>
        </SettingsGroup>
      </Stack>
    </LayoutSettings>
  )
}

export default System
