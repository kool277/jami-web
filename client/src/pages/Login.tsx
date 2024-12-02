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
import { Box, Button, FormControl, FormControlLabel, Radio, RadioGroup, Typography, useMediaQuery } from '@mui/material'
import { Theme, useTheme } from '@mui/material/styles'
import { ChangeEvent, FormEvent, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Link } from 'react-router-dom'

import { PasswordInput, UsernameInput } from '../components/Input'
import JamiWelcomeLogo from '../components/JamiWelcomeLogo'
import ProcessingRequest from '../components/ProcessingRequest'
import UnconnectedUserLayout from '../components/UnconnectedUserLayout'
import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider'
import { useGetAdminConfigQuery } from '../services/adminQueries'
import { useGetAllProviders, useLoginMutation } from '../services/authQueries'
import { inputWidth, jamiAuthLogoSize, submitButtonWidth } from '../utils/constants'

function LoginForm() {
  const currentUrl = window.location.href

  const accessToken = currentUrl.split('accessToken=')[1]

  if (accessToken) {
    localStorage.setItem('accessToken', accessToken)
    window.location.replace('/conversation')
  }

  const theme: Theme = useTheme()
  const { t } = useTranslation()
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [authMethod, setAuthMethod] = useState<string | undefined>()
  const { data } = useGetAdminConfigQuery()
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const loginMutation = useLoginMutation()
  const { isPending } = loginMutation
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const providers = useGetAllProviders()

  if (data === undefined || providers.data === undefined) {
    return <ProcessingRequest open />
  }

  if (authMethod === undefined) {
    setAuthMethod(
      data.localAuthEnabled ? 'local' : data.jamsAuthEnabled ? 'jams' : data.guestAccessEnabled ? 'guest' : 'openid',
    )
  }

  const handleUsername = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value)
  }

  const handlePassword = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
  }

  const handleSelectionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAuthMethod(event.target.value)
  }

  const login = (event: FormEvent) => {
    event.preventDefault()
    if (authMethod === undefined) {
      console.error('authMethod is undefined')
      return
    }
    if (username === '') {
      setAlertContent({ messageI18nKey: 'username_input_helper_text_empty', severity: 'error', alertOpen: true })
      return
    }
    if (password === '') {
      setAlertContent({ messageI18nKey: 'password_input_helper_text_empty', severity: 'error', alertOpen: true })
      return
    }
    loginMutation.mutate({ username, password, authMethod })
  }

  const isAlone =
    [data.localAuthEnabled, data.jamsAuthEnabled, data.guestAccessEnabled].filter((value) => value === true).length ===
    1

  const authChoicesStyle = { visibility: isAlone ? 'hidden' : 'visible' }

  return (
    <>
      <ProcessingRequest open={isPending} />
      <UnconnectedUserLayout>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            color: 'black',
            justifyContent: 'center',
            marginTop: isMobile ? '-25%' : '-45%',
          }}
        >
          <JamiWelcomeLogo logoWidth={jamiAuthLogoSize} logoHeight={jamiAuthLogoSize} />
        </Box>

        <Form
          method="post"
          id="login-form"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <UsernameInput
            data-cy="username-input"
            value={username}
            onChange={handleUsername}
            tooltipTitle={t('login_form_username_tooltip')}
            sx={{ width: theme.typography.pxToRem(inputWidth), marginTop: '40px' }}
          />
          <PasswordInput
            data-cy="password-input"
            value={password}
            onChange={handlePassword}
            tooltipTitle={t('login_form_password_tooltip')}
            sx={{ width: theme.typography.pxToRem(inputWidth), marginTop: '-16px' }}
          />
          <FormControl
            sx={{
              marginTop: '-16px',
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
              value={authMethod}
            >
              {data.localAuthEnabled && (
                <FormControlLabel value="local" control={<Radio />} label={t('jami')} sx={authChoicesStyle} />
              )}
              {data.jamsAuthEnabled && (
                <FormControlLabel value="jams" control={<Radio />} label={t('jams')} sx={authChoicesStyle} />
              )}
              {data.guestAccessEnabled && (
                <FormControlLabel value="guest" control={<Radio />} label={t('guest')} sx={authChoicesStyle} />
              )}
            </RadioGroup>
          </FormControl>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignContent: 'center',
              alignItems: 'center',
              marginTop: '-32px',
            }}
          >
            {(data.localAuthEnabled || data.jamsAuthEnabled || data.guestAccessEnabled) && (
              <Button
                data-cy="login-button"
                variant="contained"
                type="submit"
                onClick={login}
                sx={{ width: theme.typography.pxToRem(submitButtonWidth), mt: theme.typography.pxToRem(5) }}
                disabled={username === '' || password === ''}
              >
                {t('login_form_submit_button')}
              </Button>
            )}
          </Box>
        </Form>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: theme.typography.pxToRem(30) }}>
          {data.openIdAuthEnabled && (
            <Box sx={{ marginTop: '8px', display: 'flex', gap: '2px' }}>
              {providers.data.map(
                (item: { provider: string; url: string; displayName: string; colorTheme: string; icon: string }) => (
                  <Button
                    sx={{ backgroundColor: item.colorTheme ? item.colorTheme : 'unset' }}
                    key={item.provider}
                    variant="contained"
                    onClick={() => {
                      window.location.replace(item.url)
                    }}
                  >
                    {item.icon ? <img width="25px" height="25px" src={item.icon}></img> : item.displayName}
                  </Button>
                ),
              )}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            mt: theme.typography.pxToRem(10),
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body1" fontSize={13}>
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
