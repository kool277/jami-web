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

import { Box, Button, Input } from '@mui/material'
import { useState } from 'react'

import { AvatarEditor } from './ConversationAvatar'

export default function EditSwarmDetails() {
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')

  const handleSubmit = () => {
    console.log(name, description)
    setName('')
    setDescription('')
  }

  const handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.type === 'text') {
      setName(e.target.value)
    }
  }

  const handleChangeDesc = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.type === 'text') {
      setDescription(e.target.value)
    }
  }

  return (
    <Box>
      <AvatarEditor />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Input onChange={handleChangeName} type="text"></Input>
        <Input onChange={handleChangeDesc} type="text"></Input>
      </Box>
      <Box sx={{ marginTop: '5vh' }}>
        <Button onClick={handleSubmit} variant="contained">
          Submit
        </Button>
      </Box>
    </Box>
  )
}
