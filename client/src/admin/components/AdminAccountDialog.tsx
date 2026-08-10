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
import { Stack, TextField } from '@mui/material'
import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import BaseButton from '../../components/common/BaseButton.js'
import BaseModalDialog from '../../components/common/BaseModalDialog.js'

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
  const passwordMismatch = confirmation !== '' && confirmation !== password
  const canSubmit =
    !pending && password.length >= 8 && confirmation === password && (!isCreate || username.trim().length > 0)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    await onSubmit({ username: isCreate ? username.trim() : undefined, password })
  }

  return (
    <BaseModalDialog
      open={open}
      selectedValue=""
      title={t(isCreate ? 'admin_account_add' : 'admin_account_reset_password')}
      onClose={() => {
        setUsername('')
        setPassword('')
        setConfirmation('')
        onClose()
      }}
      closePolicy={['escapeKeyDown', 'backdropClick']}
      dialogWidth={400}
      actions={
        <>
          <BaseButton onClick={onClose} disabled={pending}>
            {t('dialog_cancel')}
          </BaseButton>
          <BaseButton form="admin-account-form" type="submit" disabled={!canSubmit}>
            {t(isCreate ? 'admin_account_create' : 'admin_account_reset_password')}
          </BaseButton>
        </>
      }
    >
      <Stack component="form" id="admin-account-form" spacing={2} onSubmit={handleSubmit}>
        {isCreate && (
          <TextField
            autoFocus
            required
            label={t('admin_page_accounts_overview_title_username')}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        )}
        <TextField
          required
          type="password"
          label={t('admin_page_password_placeholder')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          helperText={t('password_input_helper_text_length')}
        />
        <TextField
          required
          type="password"
          label={t('admin_page_password_repeat_placeholder')}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          error={passwordMismatch}
          helperText={passwordMismatch ? t('passwords_do_not_match') : undefined}
        />
      </Stack>
    </BaseModalDialog>
  )
}
