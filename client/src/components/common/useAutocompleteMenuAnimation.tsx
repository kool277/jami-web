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
import { keyframes } from '@emotion/react'
import { Paper, type PaperProps } from '@mui/material'
import { type Ref, useEffect, useRef, useState } from 'react'

const duration = 180

const expandMenu = keyframes`
  from { opacity: 0; transform: scaleY(0); }
  to { opacity: 1; transform: scaleY(1); }
`

const collapseMenu = keyframes`
  from { opacity: 1; transform: scaleY(1); }
  to { opacity: 0; transform: scaleY(0); }
`

type AnimatedPaperProps = PaperProps & { ref?: Ref<HTMLDivElement> }

function OpeningPaper({ children, ref, ...props }: AnimatedPaperProps) {
  return (
    <Paper ref={ref} {...props} sx={{ animation: `${expandMenu} ${duration}ms ease-out`, transformOrigin: 'top' }}>
      {children}
    </Paper>
  )
}

function ClosingPaper({ children, ref, ...props }: AnimatedPaperProps) {
  return (
    <Paper
      ref={ref}
      {...props}
      sx={{ animation: `${collapseMenu} ${duration}ms ease-out forwards`, transformOrigin: 'top' }}
    >
      {children}
    </Paper>
  )
}

export function useAutocompleteMenuAnimation() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), [])

  return {
    open,
    closing,
    slots: { paper: closing ? ClosingPaper : OpeningPaper },
    popupIndicatorSx: {
      '& .MuiAutocomplete-popupIndicator': {
        transform: open && !closing ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: `transform ${duration}ms ease-out`,
      },
    },
    onOpen: () => {
      window.clearTimeout(closeTimerRef.current)
      setClosing(false)
      setOpen(true)
    },
    onClose: () => {
      if (!open || closing) {
        return
      }

      setClosing(true)
      closeTimerRef.current = window.setTimeout(() => {
        setOpen(false)
        setClosing(false)
      }, duration)
    },
  }
}
