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
import { useLoginMutation } from '../services/authQueries'
import { inputWidth, jamiAuthLogoSize, submitButtonWidth } from '../utils/constants'
function LoginForm() {
  const theme: Theme = useTheme()
  const { t } = useTranslation()
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [authMethod, setAuthMethod] = useState<string>('local')
  const { data } = useGetAdminConfigQuery()
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const loginMutation = useLoginMutation()
  const { isPending } = loginMutation
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))

  if (data === undefined) {
    return <ProcessingRequest open />
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
            sx={{ width: theme.typography.pxToRem(inputWidth), marginTop: '10%' }}
          />
          <PasswordInput
            data-cy="password-input"
            value={password}
            onChange={handlePassword}
            tooltipTitle={t('login_form_password_tooltip')}
            sx={{ width: theme.typography.pxToRem(inputWidth), marginTop: isMobile ? '-7%' : '-10%' }}
          />
          <FormControl sx={{ marginTop: isMobile ? '-3%' : '-5%' }}>
            <RadioGroup row onChange={handleSelectionChange} value={authMethod}>
              {data.localAuthEnabled ? <FormControlLabel value="local" control={<Radio />} label={t('jami')} /> : null}
              {data.jamsAuthEnabled ? <FormControlLabel value="jams" control={<Radio />} label={t('jams')} /> : null}
              {data.guestAccessEnabled ? (
                <FormControlLabel value="guest" control={<Radio />} label={t('guest')} />
              ) : null}
              {data.openIdAuthEnabled ? (
                <FormControlLabel value="openid" control={<Radio />} label={t('openid')} />
              ) : null}
            </RadioGroup>
          </FormControl>

          <Button
            data-cy="login-button"
            variant="contained"
            type="submit"
            onClick={login}
            sx={{ width: theme.typography.pxToRem(submitButtonWidth), mt: isMobile ? '-3%' : '-5%' }}
            disabled={username === '' || password === ''}
          >
            {t('login_form_submit_button')}
          </Button>
        </Form>

        <Box
          sx={{
            mt: theme.typography.pxToRem(50),
            mb: theme.typography.pxToRem(10),
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
