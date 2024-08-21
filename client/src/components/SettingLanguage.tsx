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
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { languagesInfos, LanguageTag } from './../i18n'
import { SettingSelect, SettingSelectProps } from './Settings'

const settingLanguageOptions = languagesInfos.map(({ tag, fullName }) => ({
  label: fullName,
  payload: tag,
}))

interface LanguageProps {
  displaylabel?: boolean
}

function SettingLanguage({ displaylabel }: LanguageProps) {
  const { t, i18n } = useTranslation()
  const [labelDisplayed, setLabelDisplayed] = useState<boolean>(true)
  if (displaylabel !== undefined && displaylabel !== labelDisplayed) {
    setLabelDisplayed(displaylabel)
  }

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
      size="small"
      label={labelDisplayed ? t('settings_language') : ''}
      option={option}
      options={settingLanguageOptions}
      onChange={onChange}
    />
  )
}

export default SettingLanguage
