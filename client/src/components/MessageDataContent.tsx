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
import byteSize from 'byte-size'
import { useTranslation } from 'react-i18next'

import { DownloadFileIcon } from './SvgIcon'

interface MessageDataContentProps {
  displayName: string
  totalSize: number
  textColor?: string
  isAccountMessage?: boolean
  isNotAvailable?: boolean
}

export default function ({
  displayName,
  totalSize,
  textColor,
  isAccountMessage,
  isNotAvailable,
}: MessageDataContentProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))

  return (
    <Box
      sx={{
        maxWidth: isMobile ? '270px' : '460px',
        textOverflow: 'ellipsis',
        display: 'flex',
        flexDirection: 'row',
        alignContent: 'center',
        alignItems: 'center',
        gap: '5px',
        pb: '17px',
        pt: '7px',
        pr: '3px',
        pl: '3px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
          height: '50px',
          width: '50px',
          padding: '5px',
          backgroundColor: isAccountMessage ? '#005B8f' : 'lightgrey',
          borderRadius: '10px',
          marginTop: '-7px',
          marginBottom: '-15px',
          color: 'black', // fixed color
        }}
      >
        <DownloadFileIcon />
        <Box sx={{ fontSize: '11px', color: textColor, textWrap: 'nowrap' }}>{String(byteSize(Number(totalSize)))}</Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', color: textColor, width: isMobile ? '80%' : '88%' }}>
        <Box sx={{ textOverflow: 'ellipsis', textWrap: 'wrap' }}>{displayName}</Box>
        <Box>{isNotAvailable && <Typography sx={{ fontSize: '13px' }}>{t('ressource_not_available')}</Typography>}</Box>
      </Box>
    </Box>
  )
}
