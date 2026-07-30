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
import { Box, IconButton, Stack, Switch, TextField } from '@mui/material'
import { AccountDetails } from '@savoirfairelinux/jami-web-common'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import ConversationAvatar from '../../components/ConversationAvatar.js'
import { AddCircleIcon, DeleteIcon } from '../../components/SvgIcon.js'
import { useAuthContext } from '../../contexts/AuthProvider.js'
import { thumbnailVariants } from '../../themes/MotionVariants.js'
import { SettingsRow, SettingsSection } from './SettingsPage.js'

export default function CallPreferences() {
  const { t } = useTranslation()
  const { account, axiosInstance } = useAuthContext()

  const moderators = account.defaultModerators
  const [defaultModeratorUri, setDefaultModeratorUri] = useState('')
  const [details, setDetails] = useState(account.details)

  const addModerator = async () => {
    if (defaultModeratorUri) {
      await axiosInstance.put(`/default-moderators/${defaultModeratorUri}`)
      setDefaultModeratorUri('')
    }
  }

  const removeModerator = async (uri: string) => await axiosInstance.delete(`/default-moderators/${uri}`)

  const handleToggle = async (key: keyof AccountDetails, value: boolean) => {
    const newDetails: Partial<AccountDetails> = {}
    newDetails[key] = value ? 'true' : 'false'
    await axiosInstance.patch('/account', newDetails)
    account.updateDetails(newDetails)
    setDetails(account.details)
  }

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
      <Stack spacing={2}>
        <motion.div variants={thumbnailVariants}>
          <SettingsSection title={t('settings_calls')}>
            <SettingsRow
              title={t('settings_rendezvous_point')}
              description={t('settings_rendezvous_point_description')}
              control={
                <Switch
                  edge="end"
                  onChange={(e) => handleToggle('Account.rendezVous', e.target.checked)}
                  checked={details['Account.rendezVous'] === 'true'}
                  slotProps={{ input: { 'aria-label': t('settings_rendezvous_point') } }}
                />
              }
            />
            <SettingsRow
              title={t('settings_allow_unknown_peers')}
              description={t('settings_allow_unknown_peers_description')}
              control={
                <Switch
                  edge="end"
                  onChange={(e) => handleToggle('DHT.PublicInCalls', e.target.checked)}
                  checked={details['DHT.PublicInCalls'] === 'true'}
                  slotProps={{ input: { 'aria-label': t('settings_allow_unknown_peers') } }}
                />
              }
            />
          </SettingsSection>
        </motion.div>

        <motion.div variants={thumbnailVariants}>
          <SettingsSection title={t('settings_default_moderators')}>
            <SettingsRow
              title={t('settings_add_moderator')}
              description={t('settings_add_moderator_placeholder')}
              control={
                <Box sx={{ display: 'flex', gap: 1, minWidth: { xs: '100%', sm: 360 } }}>
                  <TextField
                    variant="outlined"
                    value={defaultModeratorUri}
                    onChange={(e) => setDefaultModeratorUri(e.target.value)}
                    label={t('settings_add_moderator')}
                    placeholder={t('settings_add_moderator_placeholder')}
                    size="small"
                    fullWidth
                  />
                  <IconButton aria-label={t('settings_add_moderator')} onClick={addModerator} size="medium">
                    <AddCircleIcon />
                  </IconButton>
                </Box>
              }
            />
            {moderators.length === 0 ? (
              <SettingsRow title={t('settings_no_moderator')} />
            ) : (
              moderators.map((moderator) => (
                <SettingsRow
                  key={moderator.uri}
                  title={moderator.getDisplayName()}
                  control={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ConversationAvatar displayName={moderator.getDisplayName()} contactUri={moderator.uri} />
                      <IconButton
                        aria-label={t('settings_remove_moderator', { moderator: moderator.getDisplayName() })}
                        onClick={() => removeModerator(moderator.uri)}
                        size="medium"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                />
              ))
            )}
          </SettingsSection>
        </motion.div>
      </Stack>
    </motion.div>
  )
}
