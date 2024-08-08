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
import { Box, InputBase, InputBaseProps, styled, useAutocomplete } from '@mui/material'
import { MUIStyledCommonProps } from '@mui/system'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ArrowHeadDown, ArrowHeadUp } from './SvgIcon'

export interface SelectOption<Payload> {
  label: string
  payload: Payload
}

const width = '250px'

type InputProps = InputBaseProps & {
  popupOpen: boolean // Sometimes the popover is opened but the Input is not focused
}

const Input = styled(({ popupOpen, ...props }: InputProps) => <InputBase {...props} />)(({ theme, popupOpen }) => ({
  width,
  height: '46px',
  borderRadius: '5px',
  border: `1px solid ${popupOpen ? theme.palette.primary.dark : '#0056995C'}`,
  boxSizing: 'border-box',
  fontSize: '15px',
  padding: '16px',
  color: theme.palette.primary.dark,
  fontWeight: 'medium',
  '&.Mui-focused': {
    // Sometimes the popover is closed but the Input is still focused
    borderColor: theme.palette.primary.dark,
    color: 'black',
  },
  '&::placeholder': {
    color: '#666666',
  },
  '&.MuiInputBase-sizeSmall': {
    height: '36px',
  },
}))

const Listbox = styled('ul')(({ theme }) => ({
  width,
  maxHeight: '230px',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
  paddingTop: '5px',
  paddingBottom: '8.5px',
  zIndex: 100,
  position: 'absolute',
  top: '-5px',
  listStyle: 'none',
  backgroundColor: 'white',
  overflow: 'auto',
  border: `1px solid ${theme.palette.primary.dark}`,
  borderEndEndRadius: '5px',
  borderEndStartRadius: '5px',
  borderTop: 'none',
}))

const Option = styled('li')(({ theme }) => ({
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '7.5px',
  paddingBottom: '7.5px',
  fontSize: '15px',
  '&.Mui-focused': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.dark,
    cursor: 'pointer',
  },
}))

const getArrowStyles = ({ theme }: MUIStyledCommonProps) => ({
  height: '6px',
  color: theme?.palette.primary.dark,
  '&:hover': {
    cursor: 'pointer',
  },
})
const StyledArrowHeadUp = styled(ArrowHeadUp)(getArrowStyles)
const StyledArrowHeadDown = styled(ArrowHeadDown)(getArrowStyles)

export type CustomSelectProps<OptionPayload> = {
  option?: SelectOption<OptionPayload>
  options: SelectOption<OptionPayload>[]
  onChange: (newValue: SelectOption<OptionPayload> | null) => void
  size?: 'small' | 'medium'
}

export const CustomSelect = <OptionPayload,>({ option, options, onChange, size }: CustomSelectProps<OptionPayload>) => {
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)

  const { getRootProps, getInputProps, getListboxProps, getOptionProps, groupedOptions, popupOpen } = useAutocomplete<
    SelectOption<OptionPayload>
  >({
    value: option,
    options,
    getOptionLabel: (option) => option.label,
    onChange: (_, value) => onChange(value),
    openOnFocus: true,
    open,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
  })

  return (
    <div>
      <Box {...getRootProps()}>
        <Input
          inputProps={getInputProps()}
          placeholder={t('select_placeholder')}
          endAdornment={popupOpen ? <StyledArrowHeadUp /> : <StyledArrowHeadDown />}
          size={size}
          // onMouseDown fires before onBlur, contrary to onClick which fires after and causes glitches
          onMouseDown={() => setOpen(!popupOpen)}
          popupOpen={popupOpen}
        />
      </Box>
      <Box position="relative">
        {groupedOptions.length > 0 ? (
          <Listbox {...getListboxProps()}>
            {(groupedOptions as SelectOption<OptionPayload>[]).map((option, index) => (
              <Option {...getOptionProps({ option, index })} key={option.label}>
                {option.label}
              </Option>
            ))}
          </Listbox>
        ) : null}
      </Box>
    </div>
  )
}
