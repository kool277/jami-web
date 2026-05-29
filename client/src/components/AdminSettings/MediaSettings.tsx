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

import { Box, Stack, Switch, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { useGetAdminConfigQuery, useUpdateAdminConfigMutation } from '../../services/adminQueries.js'
import LayoutSettings from '../LayoutSettings.js'
import ProcessingRequest from '../ProcessingRequest.js'

export default function MediaSettings() {
  const { t } = useTranslation()
  const { data } = useGetAdminConfigQuery()
  const saveAdminConfigMutation = useUpdateAdminConfigMutation()

  if (data === undefined) {
    return <ProcessingRequest open />
  }

  const handleNoLocalMediaChange = () => {
    saveAdminConfigMutation.mutate({ noLocalMediaEnabled: !data.noLocalMediaEnabled })
  }

  return (
    <LayoutSettings title={t('media_settings')} text={t('media_settings_details')}>
      <Stack spacing={3} sx={{ width: '100%', minWidth: '300px', pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            width: '100%',
          }}
        >
          <Box sx={{ textAlign: 'start' }}>
            <Typography>{t('no_local_media')}</Typography>
            <Typography variant="body2" color="textSecondary">
              {t('no_local_media_details')}
            </Typography>
          </Box>
          <Switch checked={data.noLocalMediaEnabled} onChange={handleNoLocalMediaChange} />
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'start' }}>
          {t('media_settings_restart_required')}
        </Typography>
      </Stack>
    </LayoutSettings>
  )
}
