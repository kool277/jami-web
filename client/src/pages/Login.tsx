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
import Fingerprint from '@mui/icons-material/Fingerprint'
import { Box, Divider, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { Theme, useTheme } from '@mui/material/styles'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { ChangeEvent, FormEvent, use, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Link, useNavigate } from 'react-router-dom'

import BaseButton from '../components/common/BaseButton.js'
import { PasswordInput, UsernameInput } from '../components/Input.js'
import JamiWelcomeLogo from '../components/JamiWelcomeLogo.js'
import ProcessingRequest from '../components/ProcessingRequest.js'
import UnconnectedUserLayout from '../components/UnconnectedUserLayout.js'
import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider.js'
import { AuthenticationMethods } from '../enums/authenticationMethods.js'
import { useGetAdminConfigQuery } from '../services/adminConfigQueries.js'
import { useGetAllProviders, useLoginMutation } from '../services/authQueries.js'
import { usePasskeyLoginMutation } from '../services/passkeyQueries.js'
import { inputWidth, jamiAuthLogoSize, submitButtonWidth } from '../utils/constants.js'
import { isElectronMode } from '../utils/electron.js'

function LoginForm() {
  const currentUrl = window.location.href
  const accessToken = currentUrl.split('accessToken=')[1]

  const theme: Theme = useTheme()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [authMethod, setAuthMethod] = useState<string | undefined>()
  const { data } = useGetAdminConfigQuery()
  const { setAlertContent } = use(AlertSnackbarContext)
  const loginMutation = useLoginMutation()
  const passkeyLoginMutation = usePasskeyLoginMutation()
  const { isPending } = loginMutation
  const isPasskeyPending = passkeyLoginMutation.isPending
  const passkeySupported = browserSupportsWebAuthn()
  const providers = useGetAllProviders()

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken)
      window.location.replace('/conversation')
    }
  }, [accessToken])

  if (data === undefined || providers.data === undefined) {
    return <ProcessingRequest open />
  }

  const selectedAuthMethod =
    authMethod ??
    (data.localAuthEnabled ? 'local' : data.jamsAuthEnabled ? 'jams' : data.guestAccessEnabled ? 'guest' : 'openid')

  const handleUsername = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value)
  }

  const handlePassword = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }

  const handleSelectionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAuthMethod(event.target.value)
  }

  const isAlone = [data.localAuthEnabled, data.jamsAuthEnabled].filter((value) => value === true).length === 1

  const login = (event: FormEvent) => {
    event.preventDefault()

    if (username === '') {
      setAlertContent({ messageI18nKey: 'username_input_helper_text_empty', severity: 'error', alertOpen: true })
      return
    }
    // In Electron mode, local accounts don't require a password
    if (password === '' && !(isElectronMode() && selectedAuthMethod === 'local')) {
      setAlertContent({ messageI18nKey: 'password_input_helper_text_empty', severity: 'error', alertOpen: true })
      return
    }
    loginMutation.mutate({ username, password, authMethod: selectedAuthMethod })
  }

  const guestLogin = (event: FormEvent) => {
    event.preventDefault()
    loginMutation.mutate({ username, password, authMethod: 'guest' })
  }

  return (
    <>
      <ProcessingRequest open={isPending || isPasskeyPending} />
      <UnconnectedUserLayout>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            color: 'text.primary',
            justifyContent: 'center',
          }}
        >
          <JamiWelcomeLogo logoWidth={jamiAuthLogoSize} />
        </Box>

        <Form
          method="post"
          id="login-form"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '36px',
          }}
        >
          <UsernameInput
            data-cy="username-input"
            value={username}
            onChange={handleUsername}
            tooltipTitle={t('login_form_username_tooltip')}
            sx={{ width: theme.typography.pxToRem(inputWidth) }}
          />
          {/* In Electron mode, local accounts don't require a password */}
          {!(isElectronMode() && selectedAuthMethod === 'local') && (
            <PasswordInput
              data-cy="password-input"
              value={password}
              onChange={handlePassword}
              tooltipTitle={t('login_form_password_tooltip')}
              sx={{ width: theme.typography.pxToRem(inputWidth) }}
            />
          )}
          {!isAlone && (
            <FormControl
              sx={{
                marginTop: '16px',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <RadioGroup
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  maxWidth: '200px',
                  marginLeft: '16px',
                }}
                row
                onChange={handleSelectionChange}
                value={selectedAuthMethod}
              >
                {data.localAuthEnabled && <FormControlLabel value="local" control={<Radio />} label={t('jami')} />}
                {data.jamsAuthEnabled && <FormControlLabel value="jams" control={<Radio />} label={t('jams')} />}
              </RadioGroup>
            </FormControl>
          )}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignContent: 'center',
              alignItems: 'center',
              marginTop: '12px',
              gap: '8px',
            }}
          >
            {data.guestAccessEnabled && (
              <BaseButton
                data-cy="guest-login-button"
                variant="contained"
                type="submit"
                onClick={guestLogin}
                sx={{ width: theme.typography.pxToRem(submitButtonWidth), mt: theme.typography.pxToRem(5) }}
              >
                {t('login_as_guest')}
              </BaseButton>
            )}
            {(data.localAuthEnabled || data.jamsAuthEnabled) && (
              <BaseButton
                data-cy="login-button"
                variant="contained"
                type="submit"
                onClick={login}
                sx={{ width: theme.typography.pxToRem(submitButtonWidth), mt: theme.typography.pxToRem(5) }}
                disabled={
                  selectedAuthMethod !== AuthenticationMethods.GUEST &&
                  (username === '' || (password === '' && !(isElectronMode() && selectedAuthMethod === 'local')))
                }
              >
                {t('login_form_submit_button')}
              </BaseButton>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignContent: 'center',
              alignItems: 'center',
            }}
          >
            <BaseButton
              variant="contained"
              type="button"
              onClick={() => navigate('/import-account')}
              sx={{ width: theme.typography.pxToRem(submitButtonWidth) + 100, mt: '3%' }}
            >
              {t('connect_from_another_device')}
            </BaseButton>
          </Box>
        </Form>

        {data.localAuthEnabled && passkeySupported && (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
            <Divider sx={{ width: '60%', mb: 2 }} />
            <BaseButton
              variant="outlined"
              startIcon={<Fingerprint />}
              onClick={() => passkeyLoginMutation.mutate(username || undefined)}
              disabled={isPasskeyPending}
              sx={{ width: theme.typography.pxToRem(submitButtonWidth) + 100 }}
            >
              {t('passkey_login_button')}
            </BaseButton>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: theme.typography.pxToRem(20) }}>
          {data.openIdAuthEnabled && (
            <Box sx={{ marginTop: '8px', display: 'flex', gap: '2px' }}>
              {providers.data.map(
                (item: {
                  provider: string
                  url: string
                  displayName: string
                  colorTheme: string
                  icon: string
                  redirectUri: string
                }) => (
                  <BaseButton
                    sx={{ backgroundColor: item.colorTheme ? item.colorTheme : 'unset' }}
                    key={item.provider}
                    variant="contained"
                    onClick={() => {
                      const url = item.redirectUri
                      window.location.replace(url)
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: '5px' }}>
                      <Typography sx={{ color: 'black', fontWeight: 'bolder' }}>{item.displayName}</Typography>
                      {item.icon && <img width="25px" height="25px" src={item.icon}></img>}
                    </Box>
                  </BaseButton>
                ),
              )}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            mt: theme.typography.pxToRem(6),
            mb: theme.typography.pxToRem(-16),
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              visibility: !data.localAuthEnabled ? 'hidden' : 'visible',
            }}
          >
            {t('login_form_to_registration_text')} &nbsp;
            <Link style={{ color: theme.ChatInterface.inputColor }} data-cy="register-link" to={'/register'}>
              {t('login_form_to_registration_link')}
            </Link>
          </Typography>
        </Box>
      </UnconnectedUserLayout>
    </>
  )
}
export default LoginForm
