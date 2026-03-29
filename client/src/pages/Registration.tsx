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
import { Box, Button, Typography, useMediaQuery } from '@mui/material'
import { Theme, useTheme } from '@mui/material/styles'
import { HttpStatusCode } from 'jami-web-common'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Link, useNavigate } from 'react-router-dom'

import { NameStatus, PasswordInput, PasswordStatus, UsernameInput } from '../components/Input'
import JamiWelcomeLogo from '../components/JamiWelcomeLogo'
import ProcessingRequest from '../components/ProcessingRequest'
import UnconnectedUserLayout from '../components/UnconnectedUserLayout'
import { PasswordStrength } from '../enums/passwordStrength'
import { useGetAdminConfigQuery } from '../services/adminQueries'
import {
  checkPasswordStrength,
  useCheckIfUsernameIsRegisteredQuery,
  useGetAllProviders,
  useLoginMutation,
  useRegisterMutation,
} from '../services/authQueries'
import { inputWidth, jamiAuthLogoSize, jamiUsernamePattern, submitButtonWidth } from '../utils/constants'

function RegistrationForm() {
  const theme: Theme = useTheme()
  const { t } = useTranslation()
  const [username, setUsername] = useState<string>('')
  const [debouncedUsername, setDebouncedUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [usernameStatus, setUsernameStatus] = useState<NameStatus>('default')
  const [passwordStatus, setPasswordStatus] = useState<PasswordStatus>('default')
  const registerMutation = useRegisterMutation()
  const loginMutation = useLoginMutation()
  const { isPending: isRegisterLoading } = registerMutation
  const { isPending: isLoginLoading } = loginMutation
  const isPending = isRegisterLoading || isLoginLoading
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const { data: response, isError } = useCheckIfUsernameIsRegisteredQuery(debouncedUsername)
  const usernameOk = usernameStatus === 'success'
  const passwordOk = passwordStatus !== PasswordStrength.TooWeak
  const { data } = useGetAdminConfigQuery()
  const providers = useGetAllProviders()
  const navigate = useNavigate()
  useEffect(() => {
    if (response !== undefined) {
      const { responseMessage } = response
      setUsernameStatus(responseMessage)
    }
    if (isError) {
      setUsernameStatus('invalid')
    }
  }, [response, isError])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedUsername(username)
    }, 500)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [username])

  useEffect(() => {
    if (data === undefined || data.isPending) {
      return
    }
    if (!data.localAuthEnabled) {
      navigate('/login')
    }
  }, [data, navigate])

  if (data === undefined || providers.data === undefined) {
    return <ProcessingRequest open />
  }

  const createAccount = () => {
    registerMutation.mutate(
      { username, password },
      {
        onSuccess: (response) => {
          if (response.status === HttpStatusCode.Created) {
            loginMutation.mutate({ username, password, authMethod: 'local' })
          }
        },
      },
    )
  }

  const handleUsername = async (event: ChangeEvent<HTMLInputElement>) => {
    const usernameValue: string = event.target.value
    setUsername(usernameValue)
    if (usernameValue === '') {
      setUsernameStatus('default')
      return
    }
    if (!jamiUsernamePattern.test(usernameValue)) {
      setUsernameStatus('invalid')
      return
    }
    //The valid state is when the username passes the Regex test and is ready for availability check.
    setUsernameStatus('valid')
  }

  const handlePassword = (event: ChangeEvent<HTMLInputElement>) => {
    const passwordValue: string = event.target.value
    setPassword(passwordValue)
    if (passwordValue.length > 0) {
      const checkResult = checkPasswordStrength(passwordValue)
      setPasswordStatus(checkResult.valueCode)
    } else {
      setPasswordStatus('default')
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const canCreate = usernameOk && passwordOk
    if (canCreate) {
      createAccount()
    } else {
      if (!usernameOk) {
        setUsernameStatus('registration_failed')
      }
      if (!passwordOk) {
        setPasswordStatus('registration_failed')
      }
    }
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
          }}
        >
          <JamiWelcomeLogo logoWidth={jamiAuthLogoSize} logoHeight={jamiAuthLogoSize} />
        </Box>

        <Form
          method="post"
          id="register-form"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <UsernameInput
            data-cy="username-input"
            value={username}
            onChange={handleUsername}
            status={usernameStatus}
            tooltipTitle={t('registration_form_username_tooltip')}
            sx={{ width: theme.typography.pxToRem(inputWidth) }}
          />

          <PasswordInput
            data-cy="password-input"
            value={password}
            onChange={handlePassword}
            status={passwordStatus}
            tooltipTitle={t('registration_form_password_tooltip')}
            sx={{ width: theme.typography.pxToRem(inputWidth) }}
          />
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <Button
              disabled={!usernameOk || !passwordOk}
              data-cy="register-button"
              variant="contained"
              type="submit"
              onClick={handleSubmit}
              sx={{ width: theme.typography.pxToRem(submitButtonWidth), mt: theme.typography.pxToRem(20) }}
            >
              {t('registration_form_submit_button')}
            </Button>
          </Box>
        </Form>

        <Box
          sx={{
            mt: theme.typography.pxToRem(10),
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body1" fontSize={13}>
            {t('registration_form_to_login_text')} &nbsp;
            <Link style={{ color: theme.ChatInterface.inputColor }} data-cy="login-link" to={'/login'}>
              {t('registration_form_to_login_link')}
            </Link>
          </Typography>
        </Box>
      </UnconnectedUserLayout>
    </>
  )
}
export default RegistrationForm
