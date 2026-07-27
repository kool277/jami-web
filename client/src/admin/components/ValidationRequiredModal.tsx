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

import { Box, Card, CardContent, CardHeader, Modal, useTheme } from '@mui/material'
import { useTranslation } from 'react-i18next'

import BaseButton from '../../components/common/BaseButton.js'

interface ValidationRequiredModalProps {
  open: boolean
  onClose: () => void
  onValidation: () => void
  title: string
  buttonText: string
  info?: string
}

export default function ValidationRequiredModal({
  open,
  onClose,
  onValidation,
  title,
  buttonText,
  info,
}: ValidationRequiredModalProps) {
  const theme = useTheme()
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose()
      }}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
      }}
    >
      <Card
        sx={{
          width: '350px',
          height: '350px',
          backgroundColor: theme.SettingsNeedPassword.backgroundColor,
          borderRadius: '16px',
          border: 'none',
        }}
      >
        <CardHeader title={title} />
        <CardContent sx={{ height: '100%' }}>
          <Box
            sx={{
              fontSize: '14px',
              display: 'flex',
              color: 'grey',
              maxWidth: '100%',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 'auto',
              textAlign: 'start',
              marginTop: '-14px',
            }}
          >
            {info}
          </Box>

          <Box
            sx={{
              height: '45%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'column',
            }}
          ></Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <BaseButton variant="contained" onClick={onClose}>
              {t('dialog_cancel')}
            </BaseButton>
            <BaseButton
              variant="contained"
              onClick={() => {
                onValidation()
              }}
            >
              {buttonText}
            </BaseButton>
          </Box>
        </CardContent>
      </Card>
    </Modal>
  )
}
