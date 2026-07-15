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
import { Box, Button, Input, Stack, Switch, Typography } from '@mui/material'
import { urlRegex } from '@savoirfairelinux/jami-web-common'
import { ChangeEvent, use, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Navigate } from 'react-router-dom'

import LayoutSettings from '../../components/LayoutSettings.js'
import ProcessingRequest from '../../components/ProcessingRequest.js'
import { AlertSnackbarContext } from '../../contexts/AlertSnackbarProvider.js'
import {
  useGetAdminConfigQuery,
  useGetJamsUrl,
  useSetJamsUrl,
  useUpdateAdminConfigMutation,
} from '../services/adminQueries.js'

const JamsAuthMethod = () => {
  const [accessToken] = useState(() => localStorage.getItem('adminAccessToken'))
  const { data } = useGetAdminConfigQuery()
  const jamsUrlQuery = useGetJamsUrl()
  const jamsCurrentUrl = jamsUrlQuery.data

  if (!accessToken) {
    return <Navigate to="/admin/login" replace />
  }

  // TODO: handle error and notify the user that something went wrong
  if (data === undefined || jamsCurrentUrl === undefined) {
    return <ProcessingRequest open />
  }

  return <JamsAuthMethodForm key={jamsCurrentUrl} data={data} jamsCurrentUrl={jamsCurrentUrl} />
}

const JamsAuthMethodForm = ({
  data,
  jamsCurrentUrl,
}: {
  data: NonNullable<ReturnType<typeof useGetAdminConfigQuery>['data']>
  jamsCurrentUrl: string
}) => {
  const { t } = useTranslation()
  const saveAdminConfigMutation = useUpdateAdminConfigMutation()
  const setJamsUrlMutation = useSetJamsUrl()
  const [jamsUrl, setJamsUrl] = useState<string>(jamsCurrentUrl)
  const { setAlertContent } = use(AlertSnackbarContext)

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
    <LayoutSettings title={t('jams_authentication')} text={t('jams_authentication_info')} disableMarginTop>
      <Stack spacing={3} sx={{ width: '100%', minWidth: '300px', pb: 2 }}>
        <Box sx={{ textAlign: 'start', width: '100%' }}>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography>{t('setting_auth_change', { authMethod: t('jams') })}</Typography>
            <Switch checked={data.jamsAuthEnabled} onChange={handleChange} />
          </Box>
          <Stack spacing={1.5} sx={{ mt: 3 }}>
            <Typography component="label" htmlFor="jams-url-input">
              {t('jams_url')}
            </Typography>
            <Form style={{ width: '100%' }}>
              <Input
                id="jams-url-input"
                fullWidth
                value={jamsUrl}
                onChange={handleNameChangeJamsUrl}
                placeholder={t('enter_jams_server')}
              />
            </Form>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="contained" type="submit" onClick={submitNewJamsUrl}>
                {t('save_button')}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </LayoutSettings>
  )
}
export default JamsAuthMethod
