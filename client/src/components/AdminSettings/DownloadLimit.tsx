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

import { Box, Button, Input, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertSnackbarContext } from '../../contexts/AlertSnackbarProvider'
import { useSetAutoDownloadLimit } from '../../services/adminQueries'
import { useGetAutoDownloadLimit } from '../../services/dataTransferQueries'
import ProcessingRequest from '../ProcessingRequest'

export default function DownloadLimit() {
  const limitData = useGetAutoDownloadLimit()
  const [limit, setLimit] = useState<number>(0)
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const setAutoDownloadLimitMutation = useSetAutoDownloadLimit()
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const configuredLimit = limitData.data

  useEffect(() => {
    if (configuredLimit) {
      setLimit(configuredLimit.limit)
    }
  }, [configuredLimit])

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(Number(event.target.value))
  }

  const onSave = () => {
    if (limit === undefined) {
      return
    } else if (limit === limitData.data.limit) {
      setAlertContent({
        messageI18nKey: 'same_limit_error',
        severity: 'error',
        alertOpen: true,
      })
    } else if (limit < 0) {
      setAlertContent({
        messageI18nKey: 'limit_cannot_be_negative',
        severity: 'error',
        alertOpen: true,
      })
    }
    setAutoDownloadLimitMutation.mutate(limit)
  }

  if (limitData.data === undefined || limit === undefined || limitData.isLoading) {
    return <ProcessingRequest open />
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        justifyContent: 'center',
        marginTop: '5%',
        alignItems: 'center',
      }}
    >
      <Typography variant="h3" sx={{ textAlign: 'center' }}>
        {t('download_limit')}
      </Typography>
      <Typography variant="body2" sx={{ width: isMobile ? '300px' : '500px', pt: '1%', pb: '1%' }}>
        {t('download_limit_details')}
      </Typography>
      <Box>
        {' '}
        <Input type="number" inputProps={{ min: '0' }} value={limit} onChange={handleLimitChange}></Input>
        <Button onClick={onSave}>{t('save_button')}</Button>
      </Box>
    </Box>
  )
}
