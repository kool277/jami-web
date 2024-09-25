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
  useTheme,
} from '@mui/material'
import { ChangeEvent, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Navigate } from 'react-router-dom'

import { AlertSnackbarContext } from '../../contexts/AlertSnackbarProvider'
import { AuthenticationMethods } from '../../enums/authenticationMethods'
import {
  useGetAdminConfigQuery,
  useGetJamsUrl,
  useRemoveJamsUrl,
  useSetJamsUrl,
  useUpdateAdminConfigMutation,
} from '../../services/adminQueries'
import ProcessingRequest from '../ProcessingRequest'

const JamsAuthMethod = () => {
  const { t } = useTranslation()
  const accessToken = localStorage.getItem('adminAccessToken')
  const saveAdminConfigMutation = useUpdateAdminConfigMutation()
  const { data } = useGetAdminConfigQuery()
  const theme: Theme = useTheme()
  const setJamsUrlMutation = useSetJamsUrl()
  const jamsUrlQuery = useGetJamsUrl()
  const removeJamsUrlMutation = useRemoveJamsUrl()
  const [jamsUrl, setJamsUrl] = useState<string>('')
  const { setAlertContent } = useContext(AlertSnackbarContext)

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

  const removeJamsUrl = async () => {
    removeJamsUrlMutation.mutate()
    jamsUrlQuery.refetch()
    if (jamsCurrentUrl !== undefined) {
      setJamsUrl(jamsCurrentUrl)
    }
  }

  const submitNewJamsUrl = async () => {
    // verifies if the string is a server adress or name server
    const regexValidation = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?::\d{1,5})?(\/[^\s]*)?$/.test(jamsUrl)

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
    <Box sx={{ textAlign: 'start', marginTop: '8%' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignContent: 'center',
          height: '3rem',
        }}
      >
        <span style={{ paddingRight: '10%' }}>
          {t('setting_auth_change', { authMethod: AuthenticationMethods.JAMS })}
        </span>
        <FormControl>
          <FormGroup style={{ marginTop: '2%', alignItems: 'center' }}>
            <FormControlLabel
              control={<Switch checked={data.jamsAuthEnabled} onChange={handleChange} />}
              label={undefined}
            />
          </FormGroup>
        </FormControl>
      </Box>
      <Box sx={{ textAlign: 'start', alignItems: 'start', marginTop: '8%' }}>
        <Typography>Jams URL </Typography>
        <Form>
          <Input
            sx={{ width: '100%' }}
            value={jamsUrl}
            onChange={handleNameChangeJamsUrl}
            placeholder={t('enter_jams_server')}
          />
          <Button
            variant="contained"
            type="submit"
            onClick={submitNewJamsUrl}
            sx={{ mt: theme.typography.pxToRem(20), marginRight: theme.typography.pxToRem(10) }}
          >
            {t('save_button')}
          </Button>
          <Button variant="contained" onClick={removeJamsUrl} sx={{ mt: theme.typography.pxToRem(20) }}>
            {t('remove_jams_server')}
          </Button>
        </Form>
      </Box>
    </Box>
  )
}
export default JamsAuthMethod
