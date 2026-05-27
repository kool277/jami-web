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
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  Input,
  Switch,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { urlRegex } from 'jami-web-common'
import { ChangeEvent, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Navigate } from 'react-router-dom'

import { AlertSnackbarContext } from '../../contexts/AlertSnackbarProvider.js'
import {
  useGetAdminConfigQuery,
  useGetJamsUrl,
  useSetJamsUrl,
  useUpdateAdminConfigMutation,
} from '../../services/adminQueries.js'
import LayoutSettings from '../LayoutSettings.js'
import ProcessingRequest from '../ProcessingRequest.js'

const JamsAuthMethod = () => {
  const { t } = useTranslation()
  const accessToken = localStorage.getItem('adminAccessToken')
  const saveAdminConfigMutation = useUpdateAdminConfigMutation()
  const { data } = useGetAdminConfigQuery()
  const theme: Theme = useTheme()
  const setJamsUrlMutation = useSetJamsUrl()
  const jamsUrlQuery = useGetJamsUrl()
  const [jamsUrl, setJamsUrl] = useState<string>('')
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const isWrapping = useMediaQuery(theme.breakpoints.down(500))

  const jamsCurrentUrl = jamsUrlQuery.data

  useEffect(() => {
    if (jamsCurrentUrl !== undefined) {
      setJamsUrl(jamsCurrentUrl)
    }
  }, [jamsCurrentUrl])

  if (!accessToken) {
    return <Navigate to="/admin/login" replace />
  }

  // TODO: handle error and notify the user that something went wrong
  if (data === undefined || jamsCurrentUrl === undefined) {
    return <ProcessingRequest open />
  }

  const handleChange = () => {
    saveAdminConfigMutation.mutate({ jamsAuthEnabled: !data.jamsAuthEnabled })
  }

  const handleNameChangeJamsUrl = (event: ChangeEvent<HTMLInputElement>) => {
    setJamsUrl(event.target.value)
  }

  const submitNewJamsUrl = async () => {
    // verifies if the string is a server adress or name server
    const regexValidation = urlRegex.test(jamsUrl)

    if (jamsUrl === jamsCurrentUrl) {
      setAlertContent({
        messageI18nKey: 'setting_jams_server_error_same_value',
        severity: 'error',
        alertOpen: true,
      })
      return
    }
    if (!regexValidation) {
      setAlertContent({
        messageI18nKey: 'setting_jams_server_error',
        severity: 'error',
        alertOpen: true,
      })
      return
    }
    setJamsUrlMutation.mutate(jamsUrl)
  }

  return (
    <LayoutSettings title={t('jams_authentication')} text={t('jams_authentication_info')}>
      <Box
        sx={{ display: 'flex', justifyContent: 'start', alignItems: 'center', height: '80%', paddingBottom: '20px' }}
      >
        <Box sx={{ textAlign: 'start', width: '100%', minWidth: '300px' }}>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignContent: 'start',
            }}
          >
            {t('setting_auth_change', { authMethod: t('jams') })}
            <FormControl>
              <FormGroup style={{ alignItems: 'start' }}>
                <FormControlLabel
                  control={<Switch checked={data.jamsAuthEnabled} onChange={handleChange} />}
                  label={undefined}
                />
              </FormGroup>
            </FormControl>
          </Box>
          <Box sx={{ textAlign: 'start', alignItems: 'start', marginTop: '-40px' }}>
            <Typography>{t('jams_url')}</Typography>
            <Form>
              <Input value={jamsUrl} onChange={handleNameChangeJamsUrl} placeholder={t('enter_jams_server')} />
            </Form>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button
                variant="contained"
                type="submit"
                onClick={submitNewJamsUrl}
                sx={{
                  mt: theme.typography.pxToRem(20),
                  marginLeft: theme.typography.pxToRem(10),
                  marginTop: isWrapping ? '5px' : '-15px',
                }}
              >
                {t('save_button')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </LayoutSettings>
  )
}
export default JamsAuthMethod
