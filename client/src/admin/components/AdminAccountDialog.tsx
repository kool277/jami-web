/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
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
import { InputAdornment, Stack, TextField } from '@mui/material'
import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import BaseButton from '../../components/common/BaseButton.js'
import BaseModalDialog from '../../components/common/BaseModalDialog.js'
import { PasswordIcon, PersonIcon } from '../../components/SvgIcon.js'
import { jamiUsernamePattern } from '../../utils/constants.js'

interface AdminAccountDialogProps {
  open: boolean
  mode: 'create' | 'reset-password'
  onClose: () => void
  onSubmit: (values: { username?: string; password: string }) => Promise<unknown>
  pending: boolean
}

export default function AdminAccountDialog({ open, mode, onClose, onSubmit, pending }: AdminAccountDialogProps) {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const isCreate = mode === 'create'
  const usernameInvalid = isCreate && username.length > 0 && !jamiUsernamePattern.test(username)
  const passwordTooShort = password.length > 0 && password.length < 8
  const passwordMismatch = confirmation !== '' && confirmation !== password
  const canSubmit =
    !pending &&
    password.length >= 8 &&
    confirmation === password &&
    (!isCreate || (!usernameInvalid && username.length > 0))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    await onSubmit({ username: isCreate ? username.trim() : undefined, password })
  }

  return (
    <BaseModalDialog
      open={open}
      selectedValue=""
      title={t(isCreate ? 'admin_account_add' : 'change_password')}
      onClose={() => {
        setUsername('')
        setPassword('')
        setConfirmation('')
        onClose()
      }}
      closePolicy={['escapeKeyDown', 'backdropClick']}
      dialogWidth={400}
      contentSx={{ '&.MuiDialogContent-root': { pt: 1.5 } }}
      actions={
        <>
          <BaseButton onClick={onClose} disabled={pending}>
            {t('dialog_cancel')}
          </BaseButton>
          <BaseButton form="admin-account-form" type="submit" disabled={!canSubmit}>
            {t(isCreate ? 'admin_account_create' : 'change_password')}
          </BaseButton>
        </>
      }
    >
      <Stack component="form" id="admin-account-form" spacing={2} onSubmit={handleSubmit}>
        {isCreate && (
          <TextField
            autoFocus
            required
            size="small"
            label={t('admin_page_accounts_overview_title_username')}
            value={username}
            slotProps={{
              inputLabel: {
                sx: {
                  bgcolor: 'background.paper',
                  mx: -0.5,
                  px: 0.5,
                },
              },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              },
            }}
            onChange={(event) => setUsername(event.target.value)}
            error={usernameInvalid}
            helperText={usernameInvalid ? t('username_input_helper_text_invalid') : undefined}
          />
        )}
        <TextField
          required
          type="password"
          size="small"
          label={t(isCreate ? 'password_input_label' : 'admin_page_password_placeholder')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordTooShort}
          helperText={passwordTooShort ? t('password_input_helper_text_too_short') : undefined}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PasswordIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          required
          type="password"
          size="small"
          label={t(isCreate ? 'password_input_label_repeat' : 'admin_page_password_repeat_placeholder')}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={passwordMismatch}
          helperText={passwordMismatch ? t('password_input_helper_text_not_match') : undefined}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <PasswordIcon />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>
    </BaseModalDialog>
  )
}
