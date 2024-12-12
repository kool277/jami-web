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

import Box from '@mui/material/Box'

interface EllipsisMiddleProps {
  text: string
}
const EllipsisMiddle = ({ text }: EllipsisMiddleProps) => {
  const firstPart = text.slice(0, -18)
  const lastPart = text.slice(-18)

  const stylesCommon = {
    overflow: 'hidden',
    height: 'inherit',
    flex: '0 1 auto',
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'flex-start',
        textWrap: 'nowrap',
      }}
    >
      <span style={{ ...stylesCommon, wordBreak: 'break-all' }}>{firstPart}</span>
      <span style={{ ...stylesCommon, direction: 'rtl', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {lastPart}
      </span>
    </Box>
  )
}

export default EllipsisMiddle
