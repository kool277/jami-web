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
import { useTranslation } from 'react-i18next'

import SettingLanguage from '../../../components/SettingLanguage.js'
import { SettingsPage, SettingsRow, SettingsSection } from '../SettingsPage.js'
import SettingLinkPreview from './SettingLinkPreview.js'
import SettingNotifications from './SettingNotifications.js'
import SettingTheme from './SettingTheme.js'
import SettingTips from './SettingTips.js'

function System() {
  const { t } = useTranslation()

  return (
    <SettingsPage title={t('general_settings')}>
      <SettingsSection title={t('settings_title_system')}>
        <SettingsRow title={t('settings_language')} control={<SettingLanguage doNotDisplayLabel />} />
        <SettingsRow title={t('settings_menu_item_notifications')} control={<SettingNotifications controlOnly />} />
        <SettingsRow title={t('settings_dark_theme')} control={<SettingTheme controlOnly />} />
        <SettingsRow title={t('show_tips')} control={<SettingTips controlOnly />} />
      </SettingsSection>
      <SettingsSection title={t('settings_title_chat')}>
        <SettingsRow title={t('settings_link_preview')} control={<SettingLinkPreview controlOnly />} />
      </SettingsSection>
    </SettingsPage>
  )
}

export default System
