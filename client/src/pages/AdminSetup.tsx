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
import GroupAddRounded from '@mui/icons-material/GroupAddRounded'
import { Box, Card, CardContent, Container, Fab, Input, Typography } from '@mui/material'
import { FormEvent, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider'
import { useCheckAdminSetupStatusQuery, useSetupAdminMutation } from '../services/adminQueries'

export default function AdminSetup() {
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const { t } = useTranslation()

  const { data: isSetupComplete } = useCheckAdminSetupStatusQuery()
  const setupAdminMutation = useSetupAdminMutation()
  const { isLoading } = setupAdminMutation
  const { setAlertContent } = useContext(AlertSnackbarContext)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (isSetupComplete) {
      setAlertContent({
        messageI18nKey: 'admin_page_setup_complete',
        severity: 'error',
        alertOpen: true,
      })
      return
    }
    if (!password) {
      setAlertContent({
        messageI18nKey: 'password_input_helper_text_empty',
        severity: 'error',
        alertOpen: true,
      })
      return
    }
    if (password !== passwordRepeat) {
      setAlertContent({
        messageI18nKey: 'password_input_helper_text_not_match',
        severity: 'error',
        alertOpen: true,
      })
      return
    }

    setupAdminMutation.mutate(password)
  }

  if (isSetupComplete) {
    setAlertContent({
      messageI18nKey: 'redirect_admin_setup_complete',
      severity: 'info',
      alertOpen: true,
    })
    return <Navigate to={'/admin/login'} />
  }

  if (isSetupComplete === false) {
    return (
      <Container className="message-list">
        <Card>
          <CardContent component="form" onSubmit={handleSubmit}>
            <Typography gutterBottom variant="h5" component="h2">
              {t('admin_page_setup_title')}
            </Typography>
            <Box style={{ textAlign: 'center', marginTop: 8, marginBottom: 16 }}>
              <div>
                <Input value="admin" name="username" autoComplete="username" disabled />
              </div>
              <div>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name="password"
                  type="password"
                  placeholder={t('admin_page_password_placeholder')}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Input
                  value={passwordRepeat}
                  onChange={(e) => setPasswordRepeat(e.target.value)}
                  name="password"
                  error={passwordRepeat !== password}
                  type="password"
                  placeholder={t('admin_page_password_repeat_placeholder')}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>
            </Box>
            <Box style={{ textAlign: 'center', marginTop: 24 }}>
              <Fab variant="extended" color="primary" type="submit" disabled={isLoading}>
                <GroupAddRounded />
                {t('admin_page_create_button')}
              </Fab>
            </Box>
          </CardContent>
        </Card>
      </Container>
    )
  }
  //when isSetupComplete is undefined
  else {
    return <div>{t('loading')}</div>
  }
}
