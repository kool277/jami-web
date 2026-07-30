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
import { Box, Stack, TextField } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import BaseButton from '../../../components/common/BaseButton.js'
import { AvatarEditor } from '../../../components/ConversationAvatar.js'
import { useAuthContext } from '../../../contexts/AuthProvider.js'
import { useResetDisplayName, useSetDisplayName, useUpdateAvatarMutation } from '../../../services/accountQueries.js'
import { SettingsSection } from '../SettingsPage.js'

function CustomizeProfile() {
  const { account } = useAuthContext()

  const registeredName = account.getRegisteredName()
  const displayName = account.getDisplayName()

  return <CustomizeProfileForm key={displayName} registeredName={registeredName} displayName={displayName} />
}

const CustomizeProfileForm = ({ registeredName, displayName }: { registeredName: string; displayName: string }) => {
  const { t } = useTranslation()
  const [name, setName] = useState(displayName)
  const [avatar, setAvatar] = useState<File | null>(null)

  const setDisplayName = useSetDisplayName()
  const resetDisplayName = useResetDisplayName()
  const updateAvatar = useUpdateAvatarMutation()
  const displayNameChanged = name !== displayName
  const avatarChanged = avatar !== null
  const hasChanges = displayNameChanged || avatarChanged

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleSave = async () => {
    const updates: Promise<unknown>[] = []
    if (displayNameChanged) {
      updates.push(setDisplayName.mutateAsync(name))
    }
    if (avatar) {
      const data = new FormData()
      data.append('avatar', avatar)
      updates.push(updateAvatar.mutateAsync(data).then(() => setAvatar(null)))
    }
    await Promise.allSettled(updates)
  }

  const handleReset = () => {
    resetDisplayName.mutate()
  }

  return (
    <SettingsSection title={t('settings_customize_profile')} list={false}>
      <Stack sx={{ width: '100%', gap: 2 }}>
        <Stack sx={{ alignItems: 'center' }}>
          <AvatarEditor onAvatarChange={setAvatar} />
        </Stack>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1.5 }}>
          <TextField
            fullWidth
            label={t('settings_display_name')}
            value={name}
            onChange={handleNameChange}
            size="small"
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <BaseButton
              sx={{ minWidth: 120 }}
              variant="contained"
              color="primary"
              disabled={!hasChanges || updateAvatar.isPending || setDisplayName.isPending}
              onClick={handleSave}
            >
              {t('save_button')}
            </BaseButton>
            {registeredName !== displayName && (
              <BaseButton sx={{ minWidth: 120 }} onClick={handleReset} variant="outlined" color="primary">
                {t('reset_to_default')}
              </BaseButton>
            )}
          </Stack>
        </Box>
      </Stack>
    </SettingsSection>
  )
}

export default CustomizeProfile
