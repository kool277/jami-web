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

import { Box, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material'
import {
  ConferenceResolution,
  conferenceResolutionValues,
  defaultConferenceResolution,
} from '@savoirfairelinux/jami-web-common'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  useGetAdminConfigQuery,
  useSetConferenceResolution,
  useUpdateAdminConfigMutation,
} from '../../services/adminQueries.js'
import { useGetConferenceResolution } from '../../services/dataTransferQueries.js'
import LayoutSettings from '../LayoutSettings.js'
import ProcessingRequest from '../ProcessingRequest.js'

export default function MediaSettings() {
  const conferenceResolutionData = useGetConferenceResolution()
  const noLocalMediaData = useGetAdminConfigQuery()

  if (conferenceResolutionData.data === undefined || conferenceResolutionData.isLoading) {
    return <ProcessingRequest open />
  }

  if (noLocalMediaData.data === undefined || noLocalMediaData.isLoading) {
    return <ProcessingRequest open />
  }

  const { data } = noLocalMediaData

  const configuredConferenceResolution = conferenceResolutionValues.includes(conferenceResolutionData.data.resolution)
    ? (conferenceResolutionData.data.resolution as ConferenceResolution)
    : defaultConferenceResolution

  return (
    <MediaSettingsForm
      key={`${data.noLocalMediaEnabled}-${configuredConferenceResolution}`}
      noLocalMediaEnabled={data.noLocalMediaEnabled}
      configuredConferenceResolution={configuredConferenceResolution}
    />
  )
}

const MediaSettingsForm = ({
  noLocalMediaEnabled,
  configuredConferenceResolution,
}: {
  noLocalMediaEnabled: boolean
  configuredConferenceResolution: ConferenceResolution
}) => {
  const { t } = useTranslation()
  const saveAdminConfigMutation = useUpdateAdminConfigMutation()
  const { mutate } = useSetConferenceResolution()
  const [conferenceResolution, setConferenceResolution] = useState<ConferenceResolution>(configuredConferenceResolution)
  const conferenceResolutionRef = useRef<ConferenceResolution>(configuredConferenceResolution)

  const handleNoLocalMediaChange = () => {
    saveAdminConfigMutation.mutate({ noLocalMediaEnabled: !noLocalMediaEnabled })
  }

  const handleConferenceResolutionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextResolution = event.target.value as ConferenceResolution
    setConferenceResolution(nextResolution)
    conferenceResolutionRef.current = nextResolution
  }

  const saveIfNeeded = useCallback(
    (resolution: ConferenceResolution) => {
      if (!resolution || resolution === configuredConferenceResolution) {
        return
      }

      mutate(resolution)
    },
    [configuredConferenceResolution, mutate],
  )

  useEffect(() => {
    return () => {
      saveIfNeeded(conferenceResolutionRef.current)
    }
  }, [saveIfNeeded])

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
          <Switch checked={noLocalMediaEnabled} onChange={handleNoLocalMediaChange} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
          <Box sx={{ textAlign: 'start' }}>
            <Typography>{t('conference_resolution')}</Typography>
            <Typography variant="body2" color="textSecondary">
              {t('conference_resolution_details')}
            </Typography>
          </Box>
          <Box sx={{ mt: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
            <TextField
              select
              value={conferenceResolution}
              size="small"
              sx={{ minWidth: '220px' }}
              onChange={handleConferenceResolutionChange}
            >
              {conferenceResolutionValues.map((resolution) => (
                <MenuItem key={resolution} value={resolution}>
                  {t(`conference_resolution_option_${resolution}`)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'start' }}>
          {t('media_settings_restart_required')}
        </Typography>
      </Stack>
    </LayoutSettings>
  )
}
