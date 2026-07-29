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
import { Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

import ConversationsOverviewCard from '../../components/ConversationsOverviewCard.js'
import JamiIdCard from '../../components/JamiIdCard.js'
import { useAuthContext } from '../../contexts/AuthProvider.js'
import { thumbnailVariants } from '../../themes/MotionVariants.js'
import CustomizeProfile from './AccountSettings/CustomizeProfile.js'
import LinkedDevicesPreview from './AccountSettings/LinkedDevicesPreview.js'
import PasskeyManager from './AccountSettings/PasskeyManager.js'
import { SettingsRow, SettingsSection } from './SettingsPage.js'

export default function AccountPreferences() {
  const { t } = useTranslation()
  const { account } = useAuthContext()

  const isJamiAccount = account.getType() === 'RING'

  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={{
        enter: { transition: { staggerChildren: 0.05 } },
        exit: { transition: { staggerChildren: 0.02 } },
      }}
    >
      <motion.div variants={thumbnailVariants}>
        <Typography variant="h2" component="h2" gutterBottom>
          {t('settings_title_account')}
        </Typography>
      </motion.div>

      <Stack spacing={2}>
        <motion.div variants={thumbnailVariants}>
          <SettingsSection title={t('settings_customize_profile')}>
            <SettingsRow title={t('settings_customize_profile')} control={<CustomizeProfile />} />
          </SettingsSection>
        </motion.div>

        {isJamiAccount && (
          <motion.div variants={thumbnailVariants}>
            <SettingsSection title={t('jami_account')}>
              <SettingsRow title={t('jami_account')} control={<JamiIdCard account={account} />} />
            </SettingsSection>
          </motion.div>
        )}

        <motion.div variants={thumbnailVariants}>
          <SettingsSection title={t('conversations')}>
            <SettingsRow title={t('conversations')} control={<ConversationsOverviewCard />} />
          </SettingsSection>
        </motion.div>

        <motion.div variants={thumbnailVariants}>
          <SettingsSection title={t('devices')}>
            <SettingsRow title={t('devices')} control={<LinkedDevicesPreview />} />
          </SettingsSection>
        </motion.div>

        <motion.div variants={thumbnailVariants}>
          <SettingsSection title={t('passkey_section_title')}>
            <SettingsRow title={t('passkey_section_title')} control={<PasskeyManager />} />
          </SettingsSection>
        </motion.div>
      </Stack>
    </motion.div>
  )
}
