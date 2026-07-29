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
import { Box, Button, Stack, TextField } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AvatarEditor } from '../../../components/ConversationAvatar.js'
import { useAuthContext } from '../../../contexts/AuthProvider.js'
import { useResetDisplayName, useSetDisplayName } from '../../../services/accountQueries.js'

function CustomizeProfile() {
  const { account } = useAuthContext()

  const registeredName = account.getRegisteredName()
  const displayName = account.getDisplayName()

  return <CustomizeProfileForm key={displayName} registeredName={registeredName} displayName={displayName} />
}

const CustomizeProfileForm = ({ registeredName, displayName }: { registeredName: string; displayName: string }) => {
  const { t } = useTranslation()
  const [name, setName] = useState(displayName)

  const setDisplayName = useSetDisplayName()
  const resetDisplayName = useResetDisplayName()

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleChangeValidation = () => {
    setDisplayName.mutate(name)
  }

  const handleReset = () => {
    resetDisplayName.mutate()
  }

  return (
    <Stack sx={{ width: '100%', alignItems: 'center', gap: 2 }}>
      <AvatarEditor />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 1.5 }}>
        <TextField
          fullWidth
          label={t('settings_customize_profile')}
          value={name}
          onChange={handleNameChange}
          size="small"
        />
        <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'center' }}>
          <Button sx={{ minWidth: 120 }} variant="contained" color="primary" onClick={handleChangeValidation}>
            {t('save_button')}
          </Button>
          {registeredName !== displayName && (
            <Button sx={{ minWidth: 120 }} onClick={handleReset} variant="outlined" color="primary">
              {t('reset_to_default')}
            </Button>
          )}
        </Stack>
      </Box>
    </Stack>
  )
}

export default CustomizeProfile
