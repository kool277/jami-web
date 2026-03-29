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
  useGetJamsUrl,
  useRemoveJamsUrl,
  useSetJamsUrl,
  useSetWizardStateMutation,
  useUpdateAdminConfigMutation,
} from '../../services/adminQueries'

export default function AdminConfigureJams() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const saveAdminConfigMutation = useUpdateAdminConfigMutation()
  const { data } = useGetAdminConfigQuery()
  const setJamsUrlMutation = useSetJamsUrl()
  const jamsUrlQuery = useGetJamsUrl()
  const removeJamsUrlMutation = useRemoveJamsUrl()
  const [jamsUrl, setJamsUrl] = useState<string>('')
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const setWizardStateMutation = useSetWizardStateMutation()
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const jamsCurrentUrl = jamsUrlQuery.data

  useEffect(() => {
    if (jamsCurrentUrl !== undefined) {
      setJamsUrl(jamsCurrentUrl)
    }
  }, [jamsCurrentUrl])

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
    const regexValidation = urlRegex.test(jamsUrl)
    if (jamsUrl === jamsCurrentUrl) {
      return
    }
    if (jamsUrl === '') {
      removeJamsUrlMutation.mutate()
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
    <UnconnectedUserLayout pageName={t('admin_page_setup_title')} message={t('configure_jams_server')}>
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
            <Switch checked={data.jamsAuthEnabled} onChange={handleChange} />
            <Box sx={{ textAlign: 'start', alignItems: 'start', textWrap: 'nowrap' }}>
              <Typography>Jams URL </Typography>
              <Form>
                <TextField
                  value={jamsUrl}
                  onChange={handleNameChangeJamsUrl}
                  label={t('enter_jams_server')}
                  size="small"
                />
              </Form>
            </Box>
          </Box>
        </Box>

        <Box sx={{ marginTop: '16px' }}>
          <Typography sx={{ fontSize: 'smaller' }}>{t('setting_can_be_changed_later')}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: '24px' }}>
        <Button
          onClick={() => {
            submitNewJamsUrl()
            setWizardStateMutation.mutate(AdminWizardState.local)
            navigate('/admin/setup/ns')
          }}
        >
          {t('previous')}
        </Button>
        <Button
          onClick={() => {
            submitNewJamsUrl()
            setWizardStateMutation.mutate(AdminWizardState.complete)
            navigate('/admin/accounts')
          }}
        >
          {t('next')}
        </Button>
      </Box>
    </UnconnectedUserLayout>
  )
}
