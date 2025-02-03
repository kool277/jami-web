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

import { Box, Button, Card, CardContent, CardHeader, Modal, useTheme } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form } from 'react-router-dom'

import { useAuthContext } from '../../contexts/AuthProvider'
import { PasswordInput } from '../Input'

interface PasswordRequiredModalProps {
  open: boolean
  onClose: () => void
  onValidation: (password: string) => void
  title: string
  buttonText: string
  info?: string
}

export default function PasswordRequiredModal({
  open,
  onClose,
  onValidation,
  title,
  buttonText,
  info,
}: PasswordRequiredModalProps) {
  const theme = useTheme()
  const [password, setPassword] = useState<string>('')
  const { t } = useTranslation()
  const { account } = useAuthContext()
  const hasPassword = account.details['Account.archiveHasPassword']

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose()
      }}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
      }}
    >
      <Card
        sx={{
          width: '400px',
          height: '450px',
          backgroundColor: theme.SettingsNeedPassword.backgroundColor,
          borderRadius: '6px',
          border: 'none',
        }}
      >
        <CardHeader
          title={title}
          subheader={<Box sx={{ marginTop: '20px' }}>{hasPassword ? t('enter_password_info') : ''}</Box>}
        />
        <CardContent sx={{ height: '100%' }}>
          <Box
            sx={{
              fontSize: '14px',
              display: 'flex',
              color: 'grey',
              maxWidth: '100%',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 'auto',
              textAlign: 'start',
              marginTop: '-14px',
            }}
          >
            {info}
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              height: '50%',
            }}
          >
            <Form method="post" style={{ visibility: hasPassword ? 'visible' : 'hidden' }}>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                tooltipTitle={t('login_form_password_tooltip')}
              />
            </Form>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button variant="contained" onClick={onClose}>
              {t('dialog_cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                onValidation(password)
              }}
            >
              {buttonText}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Modal>
  )
}
