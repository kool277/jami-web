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
import { Box } from '@mui/material'
import byteSize from 'byte-size'

import DownloadFileIcon from '../icons/downloadFile.svg?react'

interface MessageDataContentProps {
  displayName: string
  totalSize: number
  textColor?: string
  isAccountMessage?: boolean
}

export default function ({ displayName, totalSize, textColor, isAccountMessage }: MessageDataContentProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignContent: 'center', alignItems: 'center', gap: '5px' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
          height: '50px',
          width: '50px',
          backgroundColor: isAccountMessage ? '#005B8f' : 'lightgrey',
          borderRadius: '5px',
          marginTop: '-7px',
          marginBottom: '-15px',
        }}
      >
        <DownloadFileIcon />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', color: textColor }}>
        <Box>{displayName}</Box>
        <Box sx={{ fontSize: '11px', display: 'flex', justifyContent: 'flex-end' }}>
          {String(byteSize(Number(totalSize)))}
        </Box>
      </Box>
    </Box>
  )
}
