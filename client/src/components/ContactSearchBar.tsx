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

import SearchRounded from '@mui/icons-material/SearchRounded'
import { Box, InputBase, Stack } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import { SquareButton } from './Button'
import { PeopleGroupIcon } from './SvgIcon'

interface ContactSearchBarProps {
  placeholder: string
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function ContactSearchBar({ placeholder, handleChange }: ContactSearchBarProps) {
  const navigate = useNavigate()

  return (
    <Stack direction="row">
      <Box
        sx={{
          width: '99%',
          display: 'flex',
          justifyContent: 'center',
          borderRadius: '7px',
          backgroundColor: 'white',
          margin: '2%',
        }}
      >
        <InputBase
          type="search"
          placeholder={placeholder}
          onChange={handleChange}
          startAdornment={
            <SearchRounded
              sx={{
                color: 'grey.500',
                ml: 1,
                mr: 0.5,
              }}
            />
          }
          sx={{
            flexGrow: 1,
            // color and placeholder color does not change in dark mode
            '& .MuiInputBase-input::placeholder': { color: 'grey.600' },
            color: 'grey.900',
          }}
        />
        <SquareButton
          aria-label="start swarm"
          Icon={PeopleGroupIcon}
          onClick={() => {
            navigate('/contacts')
          }}
        />
      </Box>
    </Stack>
  )
}
