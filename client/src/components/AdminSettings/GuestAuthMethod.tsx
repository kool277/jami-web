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

import { Box, FormControl, FormControlLabel, FormGroup, Switch } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { useGetAdminConfigQuery, useUpdateAdminConfigMutation } from '../../services/adminQueries'
import LayoutSettings from '../LayoutSettings'
import ProcessingRequest from '../ProcessingRequest'

export default function GuestAuthMethod() {
  const saveAdminConfigMutation = useUpdateAdminConfigMutation()
  const { t } = useTranslation()
  const { data } = useGetAdminConfigQuery()

  // TODO: handle error and notify the user that something went wrong
  if (data === undefined) {
    return <ProcessingRequest open />
  }

  const handleChange = () => {
    saveAdminConfigMutation.mutate({ guestAccessEnabled: !data.guestAccessEnabled })
  }

  return (
    <LayoutSettings title={t('guest_authentication')} text={t('guest_authentication_info')}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%', width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '300px', gap: '20px' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignContent: 'center',
              height: '3rem',
            }}
          >
            <span style={{ paddingRight: '10%' }}>{t('setting_auth_change', { authMethod: t('guest') })}</span>
            <FormControl>
              <FormGroup style={{ marginTop: '2%', alignItems: 'center' }}>
                <FormControlLabel
                  control={<Switch checked={data.guestAccessEnabled} onChange={handleChange} />}
                  label={undefined}
                />
              </FormGroup>
            </FormControl>
          </Box>
        </Box>
      </Box>
    </LayoutSettings>
  )
}
