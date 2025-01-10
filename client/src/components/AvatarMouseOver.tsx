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

import { Box, Typography } from '@mui/material'
import { useState } from 'react'

import ConversationAvatar from './ConversationAvatar'

interface AvatarMouseOverProps {
  contactUri: string
  displayName: string
}

const AvatarMouseOver = ({ contactUri, displayName }: AvatarMouseOverProps) => {
  const avatarSize: string = '15px'
  const [isMouseOver, setIsMouseOver] = useState(false)
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      {isMouseOver && (
        <Typography
          sx={{
            position: 'absolute',
            bottom: '16px',
            left: '10px',
            transform: 'translateX(-90%)',
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            borderRadius: '5px',
            padding: '0.2em 0.4em',
            fontSize: '0.8em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            userSelect: 'none',
          }}
        >
          {displayName || contactUri}
        </Typography>
      )}
      <ConversationAvatar
        contactUri={contactUri}
        key={contactUri}
        displayName={displayName}
        sx={{
          width: avatarSize,
          height: avatarSize,
          fontSize: '12px',
          ml: 0.1,
        }}
        onMouseEnter={() => setIsMouseOver(true)}
        onMouseLeave={() => setIsMouseOver(false)}
      />
    </Box>
  )
}

export default AvatarMouseOver
