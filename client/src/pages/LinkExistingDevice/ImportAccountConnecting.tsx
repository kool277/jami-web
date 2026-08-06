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
import { DeviceAuthStateCode } from '@savoirfairelinux/jami-web-common'
import { useTranslation } from 'react-i18next'

import UnconnectedUserLayout from '../../components/UnconnectedUserLayout.js'
import CancelLinkDeviceButton from './CancelLinkDeviceButton.js'
import { useImportFlowGuard } from './useImportFlowGuard.js'

export default function ImportAccountConnecting() {
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const { t } = useTranslation()
  useImportFlowGuard(DeviceAuthStateCode.Connecting)

  return (
    <UnconnectedUserLayout pageName={t('import_account')} message={''}>
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignContent: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" gutterBottom>
            {t('action_required')}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {t('import_confirm_account')}
          </Typography>
          <CancelLinkDeviceButton />
        </Box>
      </Box>
    </UnconnectedUserLayout>
  )
}
