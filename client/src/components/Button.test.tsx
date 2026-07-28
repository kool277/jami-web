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
import { type Direction, type PaletteMode, ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { buildDefaultTheme } from '../themes/Default.js'
import { StartAudioCallButton, StartVideoCallButton } from './Button.js'

function renderWithTheme(children: ReactNode, mode: PaletteMode = 'light', direction: Direction = 'ltr') {
  return render(<ThemeProvider theme={buildDefaultTheme(mode, direction)}>{children}</ThemeProvider>)
}

describe('call buttons', () => {
  it('announces the audio call button as an audio call', () => {
    renderWithTheme(<StartAudioCallButton />)

    expect(screen.getByRole('button').getAttribute('aria-label')).toMatch(/audio/i)
  })

  it('announces the video call button as a video call', () => {
    renderWithTheme(<StartVideoCallButton />)

    expect(screen.getByRole('button').getAttribute('aria-label')).toMatch(/video/i)
  })
})
