/*
 * Copyright (C) 2025 Savoir-faire Linux Inc.
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
import { Icon, IconProps } from '@mui/material'

export interface MaterialSymbolProps extends IconProps {
  symbol: string
  filled?: boolean
}

/**
 * Renders a Material Symbols Outlined icon with weight 300.
 */
const MaterialSymbol = ({ symbol, filled, sx, ...props }: MaterialSymbolProps) => {
  return (
    <Icon
      baseClassName="material-symbols-outlined"
      {...props}
      sx={{
        fontVariationSettings: `'wght' 300${filled ? ", 'FILL' 1" : ''}`,
        ...sx,
      }}
    >
      {symbol}
    </Icon>
  )
}

export default MaterialSymbol
