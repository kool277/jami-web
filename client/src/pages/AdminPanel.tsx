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
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'
import Switch from '@mui/material/Switch'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'

import ProcessingRequest from '../components/ProcessingRequest'
import { useGetAdminConfigQuery, useUpdateAdminConfigMutation } from '../services/adminQueries'

export default function AdminPanel() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const accessToken = localStorage.getItem('adminAccessToken')

  const { data } = useGetAdminConfigQuery()
  const saveAdminConfigMutation = useUpdateAdminConfigMutation()
  const adminLogout = () => {
    localStorage.removeItem('adminAccessToken')
    navigate('/admin/login')
  }

  const toggleJamsAuthEnabled = () => {
    saveAdminConfigMutation.mutate({ jamsAuthEnabled: !data.jamsAuthEnabled })
  }
  const toggleLocalAuthEnabled = () => {
    saveAdminConfigMutation.mutate({ localAuthEnabled: !data.localAuthEnabled })
  }
  const toggleGuestAccessEnabled = () => {
    saveAdminConfigMutation.mutate({ guestAccessEnabled: !data.guestAccessEnabled })
  }
  const toggleOpenIdAuthEnabled = () => {
    saveAdminConfigMutation.mutate({ openIdAuthEnabled: !data.openIdAuthEnabled })
  }

  if (!accessToken) {
    return <Navigate to="/admin/login" replace />
  }

  if (data === undefined) {
    return <ProcessingRequest open />
  }
  //TODO: add translations
  return (
    <>
      <Button variant="contained" type="submit" onClick={adminLogout}>
        {t('logout')}
      </Button>
      <Typography variant="h3">{/*t('admin_config_main_title')*/ 'Admin panel'}</Typography>
      <Box sx={{ display: 'flex' }}>
        <FormControl>
          <FormLabel>
            <Typography variant="h3">{/*t('admin_config_auth_methods_title')*/ 'Authentication methods'}</Typography>
          </FormLabel>
          <FormGroup>
            <FormControlLabel
              control={<Switch checked={data.localAuthEnabled} onChange={toggleLocalAuthEnabled} />}
              label={/*t('admin_config_auth_method_checkbox_local')*/ 'Local'}
            />
            <FormControlLabel
              control={<Switch checked={data.jamsAuthEnabled} onChange={toggleJamsAuthEnabled} />}
              label={/*t('admin_config_auth_method_checkbox_local')*/ 'JAMS'}
            />
            <FormControlLabel
              control={<Switch disabled checked={data.guestAccessEnabled} onChange={toggleGuestAccessEnabled} />}
              label={/*t('admin_config_auth_method_checkbox_local')*/ 'Guest'}
            />
            <FormControlLabel
              control={<Switch disabled checked={data.openIdAuthEnabled} onChange={toggleOpenIdAuthEnabled} />}
              label={/*t('admin_config_auth_method_checkbox_local')*/ 'OpenID'}
            />
          </FormGroup>
        </FormControl>
      </Box>
    </>
  )
}
