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

import { Box, Button, TextField } from '@mui/material'
import { useState } from 'react'

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginTop: '5%',
      }}
    >
      <AvatarEditor />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <TextField value={name} onChange={handleNameChange} size="small" />
        <Box sx={{ display: 'flex', gap: '5%', marginTop: '2%' }}>
          <Button sx={{ width: '50%' }} variant="contained" color="primary" onClick={handleChangeValidation}>
            Save
          </Button>
          {registeredName !== displayName && (
            <Button sx={{ width: '50%' }} onClick={handleReset} variant="contained" color="primary">
              Reset
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default CustomizeProfile
