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
import { Box, IconButtonProps, Stack, TextField, TextFieldProps, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PasswordStrength } from '../enums/passwordStrength.js'
import { InfoButton, ToggleVisibilityButton } from './Button.js'
import { DialogContentList, InfosDialog, useDialogHandler } from './Dialog.js'
import { GppMaybeIcon as GppMaybe, WarningIcon as Warning } from './SvgIcon.js'
import { CheckedIcon, LockIcon, PenIcon, PersonIcon, RoundSaltireIcon } from './SvgIcon.js'

const iconsHeight = '16px'
const StyledCheckedIconSuccess = styled(CheckedIcon)(({ theme }) => ({
  height: iconsHeight,
  color: theme.palette.success.main,
}))
const StyledRoundSaltireIconError = styled(RoundSaltireIcon)(({ theme }) => ({
  height: iconsHeight,
  color: theme.palette.error.main,
}))
const StyledPenIconLight = styled(PenIcon)({ height: iconsHeight, color: '#03B9E9' })
const StyledPenIconDark = styled(PenIcon)(({ theme }) => ({ height: iconsHeight, color: theme.palette.primary.dark }))
const StyledPersonIconLight = styled(PersonIcon)({ height: iconsHeight, color: '#03B9E9' })
const StyledLockIcon = styled(LockIcon)({ height: iconsHeight, color: '#03B9E9' })

export type NameStatus = 'default' | 'success' | 'taken' | 'valid' | 'invalid' | 'registration_failed'
export type PasswordStatus = 'default' | PasswordStrength | 'registration_failed'

export type InputProps<StatusType extends NameStatus | PasswordStatus> = TextFieldProps & {
  status?: StatusType
  infoButtonProps?: IconButtonProps
  isEqual?: boolean
  tooltipTitle: string
  newPlaceHolder?: string
}

export const UsernameInput = ({
  infoButtonProps,
  status = 'default',
  tooltipTitle,
  size = 'small',
  ...props
}: InputProps<NameStatus>) => {
  const { t } = useTranslation()
  const [isSelected, setIsSelected] = useState(false)
  const dialogHandler = useDialogHandler()

  const usernameError = status === 'taken' || status === 'invalid' || status === 'registration_failed'
  const usernameSuccess = status === 'success'

  let StartAdornmentIcon = StyledPersonIconLight
  let visibility = 'visible'
  if (usernameError) {
    StartAdornmentIcon = StyledRoundSaltireIconError
  } else if (usernameSuccess) {
    StartAdornmentIcon = StyledCheckedIconSuccess
  } else if (!isSelected && !props.value) {
    visibility = 'hidden' // keep icon's space so text does not move
  }

  /*
  t('username_input_helper_text_success')
  t('username_input_helper_text_taken')
  t('username_input_helper_text_invalid')
  t('username_input_helper_text_registration_failed')
 */
  const helperText = t('username_input_helper_text', { context: `${status}` })

  const helper = (
    <Box component="span" sx={{ width: '230px', display: 'flex', justifyContent: 'center' }}>
      <Typography component="span" sx={{ textWrap: 'nowrap', fontSize: '11px' }}>
        {status !== 'default' ? helperText : ''}
      </Typography>
    </Box>
  )

  return (
    <>
      <InfosDialog {...dialogHandler.props} title={t('username_rules_dialog_title')} content={<UsernameRules />} />
      <TextField
        error={usernameError}
        label={t('username_input_label')}
        helperText={helper}
        size={size}
        onFocus={() => setIsSelected(true)}
        onBlur={() => setIsSelected(false)}
        {...props}
        slotProps={{
          input: {
            startAdornment: <StartAdornmentIcon sx={{ visibility }} />,
            endAdornment: (
              <InfoButton
                tabIndex={-1}
                tooltipTitle={tooltipTitle}
                {...infoButtonProps}
                onClick={dialogHandler.openDialog}
              />
            ),
            ...props.slotProps?.input,
          },

          inputLabel: {
            sx: {
              visibility: status !== 'default' ? 'hidden' : 'visible',
            },
            shrink: !!(isSelected || props.value),
            ...props.slotProps?.inputLabel,
          },
        }}
      />
    </>
  )
}

export const PasswordInput = ({
  infoButtonProps,
  status = 'default',
  tooltipTitle,
  newPlaceHolder,
  size = 'small',
  ...props
}: InputProps<PasswordStatus>) => {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const dialogHandler = useDialogHandler()

  const passwordError = status === PasswordStrength.TooWeak
  const passwordSuccess = status !== 'default' && !passwordError

  const toggleShowPassword = () => {
    setShowPassword((showPassword) => !showPassword)
  }

  let StartAdornmentIcon = StyledLockIcon
  let StartAdornmentIconVisibility = 'visible'
  if (passwordError) {
    StartAdornmentIcon = StyledRoundSaltireIconError
  } else if (passwordSuccess) {
    StartAdornmentIcon = StyledCheckedIconSuccess
  } else if (!isSelected && !props.value) {
    StartAdornmentIconVisibility = 'hidden' // keep icon's space so text does not move
  }

  /*
  t('password_input_helper_text_too_weak')
  t('password_input_helper_text_weak')
  t('password_input_helper_text_medium')
  t('password_input_helper_text_strong')
  t('password_input_helper_text_registration_failed')
   */
  // TODO: The status is not string anymore, hence it is unable to be used as a context to fetch the correct translation.
  // const helperText = t('password_input_helper_text', { context: `${status}` })

  const helper = (
    <Box component="span" sx={{ width: '230px', display: 'flex', justifyContent: 'center' }}>
      <Typography component="span" sx={{ textWrap: 'nowrap', fontSize: '11px' }}>
        {status === PasswordStrength.TooWeak ? t('password_input_helper_text_too_weak') : ''}
      </Typography>
    </Box>
  )

  return (
    <>
      <InfosDialog {...dialogHandler.props} title={t('password_rules_dialog_title')} content={<PasswordRules />} />
      <TextField
        error={passwordError}
        label={newPlaceHolder ? newPlaceHolder : t('password_input_label')}
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        helperText={helper}
        size={size}
        onFocus={() => setIsSelected(true)}
        onBlur={() => setIsSelected(false)}
        {...props}
        slotProps={{
          input: {
            startAdornment: <StartAdornmentIcon sx={{ visibility: StartAdornmentIconVisibility }} />,
            endAdornment: (
              <Stack
                direction="row"
                spacing="14px"
                sx={{
                  alignItems: 'center',
                }}
              >
                <ToggleVisibilityButton visible={showPassword} onClick={toggleShowPassword} />
                <InfoButton tooltipTitle={tooltipTitle} {...infoButtonProps} onClick={dialogHandler.openDialog} />
              </Stack>
            ),
            ...props.slotProps?.input,
          },

          inputLabel: {
            sx: {
              visibility: status !== 'default' ? 'hidden' : 'visible',
            },
            shrink: !!(isSelected || props.value),
            ...props.slotProps?.inputLabel,
          },
        }}
      />
    </>
  )
}

export const RepeatPasswordInput = ({
  isEqual,
  tooltipTitle,
  size = 'small',
  ...props
}: InputProps<PasswordStatus>) => {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const dialogHandler = useDialogHandler()

  const passwordError = !isEqual

  const toggleShowPassword = () => {
    setShowPassword((showPassword) => !showPassword)
  }

  let StartAdornmentIcon = StyledLockIcon
  if (passwordError) {
    StartAdornmentIcon = StyledRoundSaltireIconError
  } else {
    StartAdornmentIcon = StyledCheckedIconSuccess
  }

  return (
    <>
      <InfosDialog {...dialogHandler.props} title={t('password_rules_dialog_title')} content={<PasswordRules />} />
      <TextField
        required
        error={passwordError}
        label={t('password_input_label_repeat')}
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        size={size}
        onFocus={() => setIsSelected(true)}
        onBlur={() => setIsSelected(false)}
        {...props}
        slotProps={{
          input: {
            startAdornment: <StartAdornmentIcon sx={{ visibility: 'visible' }} />,
            endAdornment: (
              <Stack
                direction="row"
                spacing="14px"
                sx={{
                  alignItems: 'center',
                }}
              >
                <ToggleVisibilityButton visible={showPassword} onClick={toggleShowPassword} />
              </Stack>
            ),
            ...props.slotProps?.input,
          },

          inputLabel: { shrink: !!(isSelected || props.value), ...props.slotProps?.inputLabel },
        }}
      />
    </>
  )
}

//this component is not used anywhere
export const NickNameInput = ({ onChange: _onChange, ...props }: TextFieldProps) => {
  const [isSelected, setIsSelected] = useState(false)
  const [input, setInput] = useState(props.defaultValue)
  const [startAdornmentVisibility, setStartAdornmentVisibility] = useState<'visible' | 'hidden'>('hidden')

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setInput(event.target.value)
      _onChange?.(event)
    },
    [_onChange],
  )

  useEffect(() => {
    setStartAdornmentVisibility(isSelected || input ? 'visible' : 'hidden')
  }, [isSelected, input])

  return (
    <TextField
      {...props}
      label="Nickname, surname..."
      onChange={onChange}
      onFocus={() => setIsSelected(true)}
      onBlur={() => setIsSelected(false)}
      slotProps={{
        input: {
          startAdornment: <StyledPenIconLight sx={{ visibility: startAdornmentVisibility }} />,
        },

        inputLabel: { shrink: !!(isSelected || input) },
      }}
    />
  )
}

//this component is not used anywhere
export const RegularInput = ({ onChange: _onChange, ...props }: TextFieldProps) => {
  const [isSelected, setIsSelected] = useState(false)
  const [input, setInput] = useState(props.defaultValue)
  const [startAdornmentVisibility, setStartAdornmentVisibility] = useState<'visible' | 'hidden'>('hidden')
  const [endAdornmentVisibility, setEndAdornmentVisibility] = useState<'visible' | 'hidden'>('visible')

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setInput(event.target.value)
      _onChange?.(event)
    },
    [_onChange],
  )

  useEffect(() => {
    setStartAdornmentVisibility(isSelected || input ? 'visible' : 'hidden')
    setEndAdornmentVisibility(isSelected || input ? 'hidden' : 'visible')
  }, [isSelected, input])

  return (
    <TextField
      {...props}
      onChange={onChange}
      onFocus={() => setIsSelected(true)}
      onBlur={() => setIsSelected(false)}
      slotProps={{
        input: {
          startAdornment: <StyledPenIconLight sx={{ visibility: startAdornmentVisibility }} />,
          endAdornment: <StyledPenIconDark sx={{ visibility: endAdornmentVisibility }} />,
        },

        inputLabel: { shrink: !!(isSelected || input) },
      }}
    />
  )
}

//this was used for altering the color of input fields, but somehow it didn't work at all. Only the `error` prop of the input is taking effect
// function inputColor(
//   error?: boolean,
//   success?: boolean
// ): 'success' | 'error' | 'primary' | 'secondary' | 'info' | 'warning' | undefined {
//   return error ? 'error' : success ? 'success' : 'primary';
// }

const PasswordRules = () => {
  const { t } = useTranslation()
  const items = useMemo(
    () => [
      {
        Icon: GppMaybe,
        value: t('password_rule_1'),
      },
      {
        Icon: GppMaybe,
        value: t('password_rule_2'),
      },
      {
        Icon: GppMaybe,
        value: t('password_rule_3'),
      },
      {
        Icon: GppMaybe,
        value: t('password_rule_4'),
      },
      {
        Icon: GppMaybe,
        value: t('password_rule_5'),
      },
    ],
    [t],
  )
  return <DialogContentList items={items} />
}

const UsernameRules = () => {
  const { t } = useTranslation()
  const items = useMemo(
    () => [
      {
        Icon: Warning,
        value: t('username_rule_1'),
      },
      {
        Icon: Warning,
        value: t('username_rule_2'),
      },
      {
        Icon: Warning,
        value: t('username_rule_3'),
      },
      {
        Icon: Warning,
        value: t('username_rule_4'),
      },
    ],
    [t],
  )
  return <DialogContentList items={items} />
}
