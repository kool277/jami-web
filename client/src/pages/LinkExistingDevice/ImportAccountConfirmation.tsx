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

import { Box, Typography } from '@mui/material'
import { DeviceAuthStateCode, MIN_PASSWORD_LENGTH } from '@savoirfairelinux/jami-web-common'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import BaseButton from '../../components/common/BaseButton.js'
import PasswordField from '../../components/common/PasswordField.js'
import JamiWelcomeLogo from '../../components/JamiWelcomeLogo.js'
import { DoneIcon } from '../../components/SvgIcon.js'
import UnconnectedUserLayout from '../../components/UnconnectedUserLayout.js'
import { useImportDeviceContext } from '../../contexts/ImportDeviceProvider.js'
import { PasswordStrength } from '../../enums/passwordStrength.js'
import { checkPasswordStrength, type PasswordStatus, useSetPasswordMutation } from '../../services/authQueries.js'

export default function ImportAccountConfirmation() {
  const { t } = useTranslation()
  const [hasConfirmed, setHasConfirmed] = useState(false)
  const navigate = useNavigate()
  const { state, token } = useImportDeviceContext()

  useEffect(() => {
    if (!token) {
      navigate('/')
    }

    if (state !== DeviceAuthStateCode.Done) {
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
        case DeviceAuthStateCode.Authenticating:
          navigate('/import-account-unlock')
          break
        default:
          navigate('/')
          break
      }
    }
  }, [state, token, navigate])

  return (
    <UnconnectedUserLayout pageName={t('import_account')}>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center',
            alignContent: 'center',
            alignItems: 'center',
            marginTop: '-40px',
          }}
        >
          {hasConfirmed ? (
            <SetPassWord />
          ) : (
            <>
              {
                <>
                  {' '}
                  <DoneIcon sx={{ fontSize: 100 }} />
                  <Typography variant="body2">{t('import_account_done')}</Typography>
                  <Typography variant="body2">{t('import_account_successfully_imported')}</Typography>
                  <BaseButton sx={{ marginTop: '8px' }} variant="contained" onClick={() => setHasConfirmed(true)}>
                    {t('continue')}
                  </BaseButton>
                </>
              }
            </>
          )}
        </Box>
      </Box>
    </UnconnectedUserLayout>
  )
}

const SetPassWord = () => {
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<PasswordStatus>('default')
  const passwordOk =
    password.length >= MIN_PASSWORD_LENGTH &&
    passwordStatus !== 'default' &&
    passwordStatus !== 'registration_failed' &&
    passwordStatus !== PasswordStrength.TooWeak
  const { t } = useTranslation()
  const { accountId } = useImportDeviceContext()
  const setPasswordMutation = useSetPasswordMutation(accountId)

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const passwordValue = event.target.value
    setPassword(passwordValue)
    const checkResult = checkPasswordStrength(passwordValue)
    setPasswordStatus(checkResult.valueCode)
  }

  const handleRepeatPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRepeatPassword(event.target.value)
  }

  const handlePasswordSubmit = () => {
    if (password !== repeatPassword || !passwordOk) {
      return
    }
    setPasswordMutation.mutate(password)
  }

  return (
    <Box sx={{ marginTop: '-100px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <JamiWelcomeLogo logoWidth={'100px'} logoHeight={'100px'} />
      <Typography variant="body2">{t('create_password_for_online_account')}</Typography>

      <PasswordField
        label={t('password_input_label')}
        value={password}
        onChange={handlePasswordChange}
        autoComplete="new-password"
        error={passwordStatus === PasswordStrength.TooWeak || passwordStatus === 'registration_failed'}
        helperText={passwordStatus === PasswordStrength.TooWeak ? t('password_input_helper_text_too_weak') : ' '}
      />
      <PasswordField
        label={t('password_input_label_repeat')}
        value={repeatPassword}
        onChange={handleRepeatPasswordChange}
        autoComplete="new-password"
        error={repeatPassword !== '' && repeatPassword !== password}
        helperText={
          repeatPassword !== '' && repeatPassword !== password ? t('password_input_helper_text_not_match') : ' '
        }
      />
      <BaseButton variant="contained" onClick={handlePasswordSubmit}>
        {t('submit')}
      </BaseButton>
    </Box>
  )
}
