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

import { Box, Button, Typography } from '@mui/material'
import { DeviceAuthStateCode } from 'jami-web-common'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { PasswordInput, PasswordStatus, RepeatPasswordInput } from '../../components/Input.js'
import JamiWelcomeLogo from '../../components/JamiWelcomeLogo.js'
import { DoneIcon } from '../../components/SvgIcon.js'
import UnconnectedUserLayout from '../../components/UnconnectedUserLayout.js'
import { useImportDeviceContext } from '../../contexts/ImportDeviceProvider.js'
import { PasswordStrength } from '../../enums/passwordStrength.js'
import { checkPasswordStrength, useSetPasswordMutation } from '../../services/authQueries.js'

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
                  <Button sx={{ marginTop: '8px' }} variant="contained" onClick={() => setHasConfirmed(true)}>
                    {t('continue')}
                  </Button>
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
  const passwordOk = passwordStatus !== PasswordStrength.TooWeak
  const { t } = useTranslation()
  const { accountId } = useImportDeviceContext()
  const setPasswordMutation = useSetPasswordMutation(accountId)

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
    const checkResult = checkPasswordStrength(password)
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

      <PasswordInput
        value={password}
        onChange={handlePasswordChange}
        status={passwordStatus}
        tooltipTitle={t('registration_form_password_tooltip')}
      />
      <RepeatPasswordInput
        value={repeatPassword}
        onChange={handleRepeatPasswordChange}
        isEqual={passwordOk && password === repeatPassword}
        tooltipTitle={t('registration_form_password_tooltip')}
      />
      <Button variant="contained" onClick={handlePasswordSubmit}>
        {t('submit')}
      </Button>
    </Box>
  )
}
