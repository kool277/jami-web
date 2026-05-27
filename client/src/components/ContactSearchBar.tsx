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

import { Box, InputBase, Stack, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import { SquareButton } from './Button.js'
import { SearchRoundedIcon as SearchRounded } from './SvgIcon.js'
import { PeopleWithPlusSignIcon } from './SvgIcon.js'

interface ContactSearchBarProps {
  placeholder: string
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function ContactSearchBar({ placeholder, handleChange }: ContactSearchBarProps) {
  const navigate = useNavigate()
  const theme = useTheme()

  // Concentricity: margin + height/2 = Panel.borderRadius
  const searchBarMargin = `calc(${theme.Panel.padding} + ${theme.Panel.itemPadding})`
  const searchBarHeight = `calc(2 * (${theme.Panel.borderRadius} - ${theme.Panel.padding} - ${theme.Panel.itemPadding}))`

  return (
    <Stack direction="row">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: '9999px',
          backgroundColor: theme.palette.background.paper,
          m: searchBarMargin,
          height: searchBarHeight,
          flex: 1,
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
            '& .MuiInputBase-input::placeholder': { color: 'text.secondary', opacity: 1 },
            color: 'text.primary',
          }}
        />
        <SquareButton
          aria-label="add contact"
          Icon={PeopleWithPlusSignIcon}
          onClick={() => {
            navigate('/contacts')
          }}
        />
      </Box>
    </Stack>
  )
}
