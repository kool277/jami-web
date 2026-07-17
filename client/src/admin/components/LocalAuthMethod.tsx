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
import { Box, Input, Stack, Switch, Typography } from '@mui/material'
import { urlRegex } from '@savoirfairelinux/jami-web-common'
import { ChangeEvent, use, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Navigate } from 'react-router-dom'

import BaseButton from '../../components/common/BaseButton.js'
import LayoutSettings from '../../components/LayoutSettings.js'
import ProcessingRequest from '../../components/ProcessingRequest.js'
import { AlertSnackbarContext } from '../../contexts/AlertSnackbarProvider.js'
import {
  useGetAdminConfigQuery,
  useGetNameServer,
  useResetNameServer,
  useSetNameServer,
  useUpdateAdminConfigMutation,
} from '../services/adminQueries.js'

const LocalAuthMethod = () => {
  const [accessToken] = useState(() => localStorage.getItem('adminAccessToken'))
  const { data } = useGetAdminConfigQuery()
  const nameserverSet = useGetNameServer()
  const nameServerConfigured = nameserverSet.data

  if (!accessToken) {
    return <Navigate to="/admin/login" replace />
  }

  // TODO: handle error and notify the user that something went wrong
  if (data === undefined || nameServerConfigured === undefined) {
    return <ProcessingRequest open />
  }

  return <LocalAuthMethodForm key={nameServerConfigured} data={data} nameServerConfigured={nameServerConfigured} />
}

const LocalAuthMethodForm = ({
  data,
  nameServerConfigured,
}: {
  data: NonNullable<ReturnType<typeof useGetAdminConfigQuery>['data']>
  nameServerConfigured: string
}) => {
  const { t } = useTranslation()
  const saveAdminConfigMutation = useUpdateAdminConfigMutation()
  const [nameServer, setNameServer] = useState<string>(nameServerConfigured)
  const setNameServerMutation = useSetNameServer()
  const resetServerNameMutation = useResetNameServer()
  const { setAlertContent } = use(AlertSnackbarContext)

  const handleChange = () => {
    saveAdminConfigMutation.mutate({ localAuthEnabled: !data.localAuthEnabled })
  }

  const handleNameChangeNameServer = (event: ChangeEvent<HTMLInputElement>) => {
    setNameServer(event.target.value)
  }

  const deleteNameServer = async () => {
    resetServerNameMutation.mutate()
  }

  const submitNewNameServer = async () => {
    // verifies if the string is a server address or name server
    if (urlRegex.test(nameServer) && nameServer !== nameServerConfigured) {
      setNameServerMutation.mutate(nameServer)
      setNameServer('')
    } else {
      setAlertContent({
        messageI18nKey: 'setting_name_server_error',
        severity: 'error',
        alertOpen: true,
      })
    }
  }

  return (
    <LayoutSettings title={t('jami_authentication')} text={t('jami_authentication_info')} disableMarginTop>
      <Stack spacing={3} sx={{ width: '100%', minWidth: '300px', pb: 2 }}>
        <Box sx={{ textAlign: 'start', width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography>{t('setting_auth_change', { authMethod: t('jami') })}</Typography>
            <Switch checked={data.localAuthEnabled} onChange={handleChange} />
          </Box>
          <Stack spacing={1.5} sx={{ mt: 3 }}>
            <Typography component="label" htmlFor="name-server-input">
              {t('setting_name_server')}
            </Typography>
            <Form style={{ width: '100%' }}>
              <Input id="name-server-input" fullWidth value={nameServer} onChange={handleNameChangeNameServer} />
            </Form>
          </Stack>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1, mt: 3 }}>
            <BaseButton variant="contained" onClick={deleteNameServer}>
              {t('reset_nameserver_button')}
            </BaseButton>
            <BaseButton
              variant="contained"
              type="submit"
              onClick={submitNewNameServer}
              disabled={nameServer === nameServerConfigured}
            >
              {t('save_button')}
            </BaseButton>
          </Box>
        </Box>
      </Stack>
    </LayoutSettings>
  )
}

export default LocalAuthMethod
