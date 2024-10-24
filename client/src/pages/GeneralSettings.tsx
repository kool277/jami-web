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
import { Box, Stack, Typography } from '@mui/material'
import { useCallback, useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SettingSelect, SettingSelectProps, SettingsGroup, SettingSwitch } from '../components/Settings'
import { CustomThemeContext } from '../contexts/CustomThemeProvider'
import { languagesInfos, LanguageTag } from '../i18n'

export default function GeneralPreferences() {
  const { t } = useTranslation()

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Stack
        sx={{
          padding: '3%',
        }}
      >
        <Typography variant="h2">{t('settings_title_general')}</Typography>
        <SettingsGroup label={t('settings_title_system')}>
          <SettingTheme />
          <SettingTips />
          <SettingLanguage />
        </SettingsGroup>
        <SettingsGroup label={t('settings_title_chat')}>
          <SettingLinkPreview />
        </SettingsGroup>
      </Stack>
    </Box>
  )
}

const SettingTheme = () => {
  const { t } = useTranslation()

  const { mode, toggleMode } = useContext(CustomThemeContext)

  return <SettingSwitch label={t('settings_dark_theme')} onChange={toggleMode} checked={mode === 'dark'} />
}

const SettingTips = () => {
  const [isDisabled, setIsDisabled] = useState<boolean>(localStorage.getItem('disable-tips') === 'true')

  const handleTipState = () => {
    if (isDisabled) {
      localStorage.removeItem('disable-tips')
      setIsDisabled(false)
      return
    }
    localStorage.setItem('disable-tips', 'true')
    setIsDisabled(true)
  }

  return <SettingSwitch label="Disable tips" onChange={handleTipState} checked={isDisabled} />
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
    <SettingSelect
      label={t('settings_language')}
      option={option}
      options={settingLanguageOptions}
      onChange={onChange}
    />
  )
}

const SettingLinkPreview = () => {
  const { t } = useTranslation()

  const [isOn, setIsOn] = useState<boolean>(true)

  return <SettingSwitch label={t('settings_link_preview')} onChange={() => setIsOn((isOn) => !isOn)} checked={isOn} />
}
