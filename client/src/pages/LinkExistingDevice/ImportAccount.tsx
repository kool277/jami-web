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

import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import { QRCodeCanvas } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import BaseButton from '../../components/common/BaseButton.js'
import ProcessingRequest from '../../components/ProcessingRequest.js'
import { ContentCopyIcon } from '../../components/SvgIcon.js'
import UnconnectedUserLayout from '../../components/UnconnectedUserLayout.js'
import { useImportDeviceContext } from '../../contexts/ImportDeviceProvider.js'
import { useWebSocketLinkContext } from '../../contexts/WebSocketLinkProvider.js'
import { useGetLinkTokenQuery } from '../../services/authQueries.js'

export default function ImportAccount() {
  const { t } = useTranslation()
  const { setToken: setWebSocketToken, token: webSocketToken } = useWebSocketLinkContext()
  const { token, setToken } = useImportDeviceContext()
  const values = useGetLinkTokenQuery()
  const [copied, setCopied] = useState(false)

  const fetchedToken = values.data?.details?.['token']
  const webSocketJwt = values.data?.jwt

  useEffect(() => {
    // The websocket must be opened as soon as the token is issued, otherwise the states the daemon
    // reports while the user reads the code are sent to nobody.
    if (webSocketToken === undefined && webSocketJwt) {
      setWebSocketToken(webSocketJwt)
    }
    if (token === '' && fetchedToken) {
      setToken(fetchedToken)
    }
  }, [token, fetchedToken, webSocketJwt, webSocketToken, setWebSocketToken, setToken])

  const handleCopy = () => {
    navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (values.isLoading || values.isPending) {
    return <ProcessingRequest open={true} />
  }

  if (values.isError) {
    return (
      <UnconnectedUserLayout pageName={t('import_account')}>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <Typography variant="body2" color="error" align="center">
            {t('link_device_could_not_initiate')}
          </Typography>
          <BaseButton variant="outlined" onClick={() => values.refetch()}>
            {t('retry')}
          </BaseButton>
        </Box>
      </UnconnectedUserLayout>
    )
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
        }}
      >
        <Box>{token && <QRCodeCanvas size={160} value={token} />}</Box>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <Typography variant="body2" align="center">
            {t('import_account_enter_code_manually')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              maxWidth: '100%',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 'bold',
                wordBreak: 'break-all',
                textAlign: 'center',
              }}
            >
              {token}
            </Typography>
            <Tooltip title={copied ? t('copied_to_clipboard') : t('copy_to_clipboard')}>
              <IconButton onClick={handleCopy} size="small" aria-label={t('copy_to_clipboard')}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </UnconnectedUserLayout>
  )
}
