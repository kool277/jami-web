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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import SettingLanguage from '../SettingLanguage'
import { SettingsGroup, SettingSwitch } from '../Settings'

function System() {
  const { t } = useTranslation()
  return (
    <SettingsGroup label={t('settings_title_system')}>
      <SettingLanguage />
      <SettingLinkPreview />
    </SettingsGroup>
  )
}

const SettingLinkPreview = () => {
  const { t } = useTranslation()

  const [isOn, setIsOn] = useState<boolean>(true)

  return <SettingSwitch label={t('settings_link_preview')} onChange={() => setIsOn((isOn) => !isOn)} checked={isOn} />
}

export default System
