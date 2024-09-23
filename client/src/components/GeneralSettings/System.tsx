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
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { useCallback, useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { NotificationContext } from '../../contexts/NotificationsProvider'
import { languagesInfos, LanguageTag } from '../../i18n'
import { SettingSelect, SettingSelectProps, SettingsGroup, SettingSwitch } from '../Settings'

function System() {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  return (
    <Box sx={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start', padding: '2%' }}>
      <SettingsGroup label={t('settings_title_system')}>
        <SettingLanguage />
        <SettingLinkPreview />
        <SettingNotifications />
      </SettingsGroup>
    </Box>
  )
}

const settingLanguageOptions = languagesInfos.map(({ tag, fullName }) => ({
  label: fullName,
  payload: tag,
}))

const SettingLanguage = () => {
  const { t, i18n } = useTranslation()

  const option = useMemo(
    // TODO: Tell Typescript the result can't be undefined
    () => settingLanguageOptions.find((option) => option.payload === i18n.language),
    [i18n.language],
  )

  const onChange = useCallback<SettingSelectProps<LanguageTag>['onChange']>(
    (newValue) => {
      if (newValue) {
        i18n.changeLanguage(newValue.payload)
      }
    },
    [i18n],
  )

  return (
    <Box sx={{ mt: '2%', mb: '2%' }}>
      <SettingSelect
        label={t('settings_language')}
        option={option}
        options={settingLanguageOptions}
        onChange={onChange}
      />
    </Box>
  )
}

const SettingLinkPreview = () => {
  const { t } = useTranslation()

  const [isOn, setIsOn] = useState<boolean>(true)

  return (
    <Box sx={{ mt: '2%', mb: '2%' }}>
      <SettingSwitch label={t('settings_link_preview')} onChange={() => setIsOn((isOn) => !isOn)} checked={isOn} />{' '}
    </Box>
  )
}

const SettingNotifications = () => {
  const { t } = useTranslation()
  const { enable, setIsEnabled } = useContext(NotificationContext)

  const [isOn, setIsOn] = useState<boolean>(enable)

  const onChange = useCallback(() => {
    setIsEnabled(!isOn)
    setIsOn((isOn) => !isOn)
  }, [isOn, setIsEnabled])

  return <SettingSwitch label={t('settings_menu_item_notifications')} onChange={onChange} checked={isOn} />
}

export default System
