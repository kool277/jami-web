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

import { Box, Button, Switch, TextField, Typography, useMediaQuery, useTheme } from '@mui/material'
import { AdminWizardState, urlRegex } from 'jami-web-common'
import { ChangeEvent, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, useNavigate } from 'react-router-dom'

import ProcessingRequest from '../../components/ProcessingRequest'
import UnconnectedUserLayout from '../../components/UnconnectedUserLayout'
import { AlertSnackbarContext } from '../../contexts/AlertSnackbarProvider'
import {
  useGetAdminConfigQuery,
  useGetNameServer,
  useResetNameServer,
  useSetNameServer,
  useSetWizardStateMutation,
  useUpdateAdminConfigMutation,
} from '../../services/adminQueries'

export default function AdminConfigureNameServer() {
  const { t } = useTranslation()

  const { setAlertContent } = useContext(AlertSnackbarContext)
  const navigate = useNavigate()
  const setNameServerMutation = useSetNameServer()
  const nameserverSet = useGetNameServer()
  const saveAdminConfigMutation = useUpdateAdminConfigMutation()
  const resetServerNameMutation = useResetNameServer()
  const nameServerConfigured = nameserverSet.data
  const [nameServer, setNameServer] = useState<string>('') // call the server to get the current value
  const { data } = useGetAdminConfigQuery()
  const setWizardStateMutation = useSetWizardStateMutation()
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))

  useEffect(() => {
    if (nameServerConfigured !== undefined) {
      setNameServer(nameServerConfigured)
    }
  }, [nameServerConfigured])

  if (data === undefined || nameServerConfigured === undefined) {
    return <ProcessingRequest open />
  }

  const handleChange = () => {
    saveAdminConfigMutation.mutate({ localAuthEnabled: !data.localAuthEnabled })
  }

  const handleNameChangeNameServer = (event: ChangeEvent<HTMLInputElement>) => {
    setNameServer(event.target.value)
  }

  const submitNewNameServer = async () => {
    if (urlRegex.test(nameServer) && nameServer !== nameServerConfigured) {
      setNameServerMutation.mutate(nameServer)
      setWizardStateMutation.mutate(AdminWizardState.jams)
      navigate('/admin/setup/jams')
    } else if (nameServer === nameServerConfigured) {
      setWizardStateMutation.mutate(AdminWizardState.jams)
      navigate('/admin/setup/jams')
    } else if (nameServer === '') {
      resetServerNameMutation.mutate()
      setWizardStateMutation.mutate(AdminWizardState.jams)
      navigate('/admin/setup/jams')
    } else {
      setAlertContent({
        messageI18nKey: 'setting_name_server_error',
        severity: 'error',
        alertOpen: true,
      })
    }
  }

  return (
    <UnconnectedUserLayout pageName={t('admin_page_setup_title')} message={t('configure_nameserver')}>
      <Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', mb: 2 }}>
          <Box
            sx={{
              textAlign: 'start',
              marginTop: isMobile ? '16px' : 0,
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              alignContent: 'center',
            }}
          >
            <Switch checked={data.localAuthEnabled} onChange={handleChange} />
            <Box sx={{ textAlign: 'start', alignItems: 'start', textWrap: 'nowrap' }}>
              <Typography>{t('setting_name_server')}</Typography>
              <Form>
                <TextField value={nameServer} onChange={handleNameChangeNameServer} size="small" />
              </Form>
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            marginTop: '16px',
            width: isMobile ? '90vw' : 'unset',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontSize: 'smaller', maxWidth: '500px' }}>{t('setting_can_be_changed_later')}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '24px' }}>
        <Button sx={{ visibility: 'hidden' }}>{t('previous')}</Button>
        <Button onClick={submitNewNameServer}>{t('next')}</Button>
      </Box>
    </UnconnectedUserLayout>
  )
}
