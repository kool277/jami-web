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
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'
import Switch from '@mui/material/Switch'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import ProcessingRequest from '../../components/ProcessingRequest'
import {
  useGetAdminAuthMethods,
  useGetAdminConfigQuery,
  useUpdateAdminConfigMutation,
} from '../../services/adminQueries'
export default function AuthMethods() {
  const { t } = useTranslation()
  const accessToken = localStorage.getItem('adminAccessToken')
  const { data } = useGetAdminConfigQuery()
  const saveAdminConfigMutation = useUpdateAdminConfigMutation()
  async function useToggleJamsAuthEnabled() {
    if ((await useVerifySelectedOptions()) || !data.jamsAuthEnabled) {
      saveAdminConfigMutation.mutate({ jamsAuthEnabled: !data.jamsAuthEnabled })
    }
  }
  async function useToggleLocalAuthEnabled() {
    if ((await useVerifySelectedOptions()) || !data.localAuthEnabled) {
      saveAdminConfigMutation.mutate({ localAuthEnabled: !data.localAuthEnabled })
    }
  }
  async function useToggleGuestAccessEnabled() {
    if ((await useVerifySelectedOptions()) || !data.guestAccessEnabled) {
      saveAdminConfigMutation.mutate({ guestAccessEnabled: !data.guestAccessEnabled })
    }
  }
  async function useToggleOpenIdAuthEnabled() {
    if ((await useVerifySelectedOptions()) || !data.openIdAuthEnabled) {
      saveAdminConfigMutation.mutate({ openIdAuthEnabled: !data.openIdAuthEnabled })
    }
  }
  if (!accessToken) {
    return <Navigate to="/admin/login" replace />
  }
  if (data === undefined) {
    return <ProcessingRequest open />
  }
  async function useVerifySelectedOptions() {
    const selected = await useGetAdminAuthMethods()
    if (selected) {
      if (selected.filter((d) => d === true).length > 1) {
        return true
      }
      return false
    }
    throw new Error('Unable to contact the server')
  }
  //TODO: add translations
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignContent: 'center',
          marginTop: '8%',
        }}
      >
        <Box sx={{ display: 'flex', height: 'auto', justifyContent: 'center', p: '1%', border: 1, borderRadius: 5 }}>
          <FormControl sx={{ textAlign: 'center', alignContent: 'center', display: 'flex', justifyContent: 'center' }}>
            <FormLabel>
              <Typography variant="h3">{t('admin_config_auth_methods_title')}</Typography>
            </FormLabel>
            <FormGroup style={{ marginTop: '2%', alignItems: 'center' }} row={true}>
              <FormControlLabel
                control={<Switch checked={data.localAuthEnabled} onChange={useToggleLocalAuthEnabled} />}
                label={t('jami')}
              />
              <FormControlLabel
                control={<Switch checked={data.jamsAuthEnabled} onChange={useToggleJamsAuthEnabled} />}
                label={t('jams')}
              />
              <FormControlLabel
                label={t('guest')}
                control={<Switch checked={data.guestAccessEnabled} onChange={useToggleGuestAccessEnabled} />}
              />
              <FormControlLabel
                control={<Switch checked={data.openIdAuthEnabled} onChange={useToggleOpenIdAuthEnabled} />}
                label={t('openid')}
              />
            </FormGroup>
          </FormControl>
        </Box>
      </div>
    </>
  )
}
