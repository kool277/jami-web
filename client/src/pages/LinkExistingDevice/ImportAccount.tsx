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

import { Box, Typography, useMediaQuery, useTheme } from '@mui/material'
import { QRCodeCanvas } from 'qrcode.react'
import { useTranslation } from 'react-i18next'

import ProcessingRequest from '../../components/ProcessingRequest.js'
import UnconnectedUserLayout from '../../components/UnconnectedUserLayout.js'
import { useImportDeviceContext } from '../../contexts/ImportDeviceProvider.js'
import { useWebSocketLinkContext } from '../../contexts/WebSocketLinkProvider.js'
import { useGetLinkTokenQuery } from '../../services/authQueries.js'

export default function ImportAccount() {
  const theme = useTheme()
  const { t } = useTranslation()
  const { setToken: setImportToken, token: wsToken } = useWebSocketLinkContext()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const { token, setToken } = useImportDeviceContext()
  const values = useGetLinkTokenQuery()

  if (values.isLoading) {
    return <ProcessingRequest open={true} />
  } else if (values.isPending) {
    return <ProcessingRequest open={true} />
  }

  if (token === '' && values.data.details['token'] !== '') {
    const importToken = localStorage.getItem('importToken')
    if (importToken && wsToken === undefined) {
      setImportToken(importToken)
    }
    setToken(values.data.details['token'])
  }

  return (
    <UnconnectedUserLayout pageName={t('import_account')} message={t('import_account_initiate_on_old_device_qr')}>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '20px',
          marginTop: isMobile ? '70px' : '-50px',
        }}
      >
        <Box>
          <QRCodeCanvas size={160} value={token} />
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            marginTop: isMobile ? '20px' : 'unset',
          }}
        >
          <Typography variant="body2" gutterBottom>
            {t('import_account_enter_code_manually')}
          </Typography>
          <Typography
            variant="body2"
            gutterBottom
            sx={{ fontWeight: 'bolder', fontSize: isMobile ? '10px' : '11px', textWrap: 'nowrap' }}
          >
            {token}
          </Typography>
        </Box>
      </Box>
    </UnconnectedUserLayout>
  )
}
