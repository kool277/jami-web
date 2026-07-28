/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
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

import { alpha, Box, Typography, useTheme } from '@mui/material'
import { use, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider.js'
import { Account } from '../models/account.js'
import BaseIconButton from './common/BaseIconButton.js'
import QrCodeModal from './QrCodeModal.js'
import { ContentCopyIcon, JamiIdIcon, QrCodeIcon } from './SvgIcon.js'

type JamiIdDisplayProps = {
  account: Account
}

export default function JamiIdDisplay({ account }: JamiIdDisplayProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const { setAlertContent } = use(AlertSnackbarContext)
  const jamiId = account.getUri()
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jamiId)
      setAlertContent({
        messageI18nKey: 'copied_to_clipboard',
        severity: 'success',
        alertOpen: true,
      })
    } catch {
      setAlertContent({
        messageI18nKey: 'unknown_error_alert',
        severity: 'error',
        alertOpen: true,
      })
    }
  }

  return (
    <Box
      sx={{
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        borderRadius: 3,
        display: 'flex',
        gap: 1,
        alignItems: 'center',
        maxWidth: '100%',
        pl: '8px',
        pr: '4px',
        pt: '4px',
        pb: '4px',
        width: 'fit-content',
      }}
    >
      <JamiIdIcon sx={{ flexShrink: 0 }} />
      <Typography noWrap sx={{ flex: '1 1 auto', fontFamily: 'monospace', minWidth: 0 }}>
        {jamiId}
      </Typography>
      <Box sx={{ alignItems: 'center', display: 'flex', flexShrink: 0 }}>
        <BaseIconButton
          aria-label={t('copy_to_clipboard')}
          color="inherit"
          onClick={handleCopy}
          size="small"
          tooltip={t('copy_to_clipboard')}
        >
          <ContentCopyIcon />
        </BaseIconButton>
        <BaseIconButton
          aria-label={t('contact_details_qr_code')}
          color="inherit"
          onClick={() => setIsQrCodeModalOpen(true)}
          size="small"
          tooltip={t('contact_details_qr_code')}
        >
          <QrCodeIcon />
        </BaseIconButton>
      </Box>
      <QrCodeModal account={account} open={isQrCodeModalOpen} onClose={() => setIsQrCodeModalOpen(false)} />
    </Box>
  )
}
