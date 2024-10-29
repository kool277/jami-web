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

import { Box, Button, Input } from '@mui/material'
import { useEffect, useState } from 'react'

import { useAuthContext } from '../../contexts/AuthProvider'
import { useResetDisplayName, useSetDisplayName } from '../../services/accountQueries'
import { AvatarEditor } from '../ConversationAvatar'

function CustomizeProfile() {
  const { account } = useAuthContext()

  const registeredName = account.getRegisteredName()
  const displayName = account.getDisplayName()

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

  useEffect(() => {
    setName(displayName)
  }, [registeredName, displayName])

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
        <Input value={name} onChange={handleNameChange}></Input>
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
