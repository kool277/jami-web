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

import { Box, Button, Card, CardContent, Input, Typography, useMediaQuery, useTheme } from '@mui/material'
import { t } from 'i18next'
import { DeviceAuthStateCode } from 'jami-web-common'
import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import EllipsisMiddle from '../../components/EllipsisMiddle'
import UnconnectedUserLayout from '../../components/UnconnectedUserLayout'
import { AlertSnackbarContext } from '../../contexts/AlertSnackbarProvider'
import { useImportDeviceContext } from '../../contexts/ImportDeviceProvider'
import { useProvideAccountAuthentication } from '../../services/accountQueries'
import { IProvideAccountAuthentication } from '../../utils/utils'

export default function ImportAccountLock() {
  const theme = useTheme()
  const [password, setPassword] = useState('')
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const navigate = useNavigate()
  const { details, accountId, state, token } = useImportDeviceContext()
  const isMobile = useMediaQuery(theme.breakpoints.only('xs'))
  const peerId = details.get('peer_id')
  const peerDeviceId = details.get('peer_device_id')
  const hasPassword = details.get('auth_scheme') === 'password'
  const authError = details.get('auth_error') === 'bad_password'
  const provideAccountAuthenticationMutation = useProvideAccountAuthentication()

  useEffect(() => {
    if (!token) {
      navigate('/')
    }

    if (state !== DeviceAuthStateCode.Authenticating) {
      switch (state) {
        case DeviceAuthStateCode.Init:
          navigate('/')
          break
        case DeviceAuthStateCode.Connecting:
          navigate('/import-account-connecting')
          break
        case DeviceAuthStateCode.InProgress:
          navigate('/import-account-in-progress')
          break
        case DeviceAuthStateCode.Done:
          navigate('/import-account-done')
          break
        default:
          navigate('/')
          break
      }
    }
  }, [token, state, navigate])

  if (authError) {
    setAlertContent({
      messageI18nKey: 'auth_error_while_linking_device',
      severity: 'error',
      alertOpen: true,
    })
  }

  const handleSubmit = () => {
    if (hasPassword) {
      const data: IProvideAccountAuthentication = {
        password: password,
        scheme: 'password',
        accountId: accountId,
      }
      provideAccountAuthenticationMutation.mutate(data)
      return
    }
    const data: IProvideAccountAuthentication = {
      password: '',
      scheme: 'password',
      accountId: accountId,
    }
    provideAccountAuthenticationMutation.mutate(data)
  }

  const onChangepassword = (e: any) => {
    setPassword(e.target.value)
  }

  return (
    <UnconnectedUserLayout pageName={hasPassword ? t('unlock_account') : t('confirm_connection')}>
      <Box
        sx={{
          display: 'flex',
          gap: '20px',
          flexDirection: 'column',
          width: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          alignItems: 'center',
          marginTop: '-120px',
        }}
      >
        <Card sx={{ maxWidth: '400px', width: '100%' }}>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                alignItems: 'center',
                textAlign: 'enter',
                justifyContent: 'center',
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: '8px' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'nowrap', fontWeight: 'bolder' }}>{'PeerId: '}</Box>{' '}
                  <Box sx={{ maxWidth: isMobile ? '200px' : '300px' }}>
                    {' '}
                    <EllipsisMiddle text={' ' + (peerId || 'e3eaee01f47f98216f4160658179420ff5e30f50')} />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: '8px' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'nowrap', fontWeight: 'bolder' }}>{'DeviceId: '}</Box>
                  <Box sx={{ maxWidth: isMobile ? '200px' : '300px' }}>
                    <EllipsisMiddle text={' ' + (peerDeviceId || 'e3eaee01f47f98216f4160658179420ff5e30f50')} />
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
        {hasPassword && (
          <>
            {' '}
            <Box>
              <Typography variant="body2" gutterBottom>
                {t('account_locked_with_password')}
              </Typography>
              <Typography variant="body2" gutterBottom>
                {t('unlock_to_continue')}
              </Typography>
            </Box>
            <Input onChange={onChangepassword}></Input>
          </>
        )}
        <Button variant="contained" onClick={handleSubmit} disabled={hasPassword && password === ''}>
          {hasPassword ? t('connect') : t('confirm')}
        </Button>
      </Box>
    </UnconnectedUserLayout>
  )
}
