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

import { Box, Button, TextField } from '@mui/material'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertSnackbarContext } from '../../contexts/AlertSnackbarProvider.js'
import { useSetAutoDownloadLimit } from '../../services/adminQueries.js'
import { useGetAutoDownloadLimit } from '../../services/dataTransferQueries.js'
import LayoutSettings from '../LayoutSettings.js'
import ProcessingRequest from '../ProcessingRequest.js'

export default function DownloadLimit() {
  const limitData = useGetAutoDownloadLimit()

  if (limitData.data === undefined || limitData.isLoading) {
    return <ProcessingRequest open />
  }

  return <DownloadLimitForm key={limitData.data.limit} configuredLimit={limitData.data.limit} />
}

const DownloadLimitForm = ({ configuredLimit }: { configuredLimit: number }) => {
  const [currentLimit, setCurrentLimit] = useState<number>(configuredLimit)
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const setAutoDownloadLimitMutation = useSetAutoDownloadLimit()
  const { t } = useTranslation()

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentLimit(Number(event.target.value))
  }

  const onSave = () => {
    if (currentLimit === undefined) {
      return
    } else if (currentLimit < 0) {
      setAlertContent({
        messageI18nKey: 'limit_cannot_be_negative',
        severity: 'error',
        alertOpen: true,
      })
      return
    } else if (currentLimit === configuredLimit) {
      setAlertContent({
        messageI18nKey: 'same_limit_error',
        severity: 'error',
        alertOpen: true,
      })
      return
    }
    setAutoDownloadLimitMutation.mutate(currentLimit)
  }

  return (
    <LayoutSettings title={t('download_limit')} text={t('download_limit_details')}>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: '10px' }}>
        {' '}
        <TextField
          type="number"
          value={currentLimit}
          onChange={handleLimitChange}
          size="small"
          slotProps={{
            htmlInput: { min: '0' },
          }}
        />
        <Button variant="contained" onClick={onSave}>
          {t('save_button')}
        </Button>
      </Box>
    </LayoutSettings>
  )
}
