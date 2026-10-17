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
import { ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ContextType } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { CustomThemeContext } from '../../../contexts/CustomThemeProvider.js'
import { buildDefaultTheme } from '../../../themes/Default.js'
import { ChatBackground } from '../../../utils/chatBackground.js'
import SettingChatBackground from './SettingChatBackground.js'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// The real provider loads the translations when imported; only its context is needed here.
vi.mock('../../../contexts/CustomThemeProvider.js', async () => {
  const { createContext } = await import('react')
  return { CustomThemeContext: createContext(undefined) }
})

function renderSetting(chatBackground: ChatBackground) {
  const setChatBackground = vi.fn()
  const context: ContextType<typeof CustomThemeContext> = {
    mode: 'light',
    toggleMode: vi.fn(),
    animationsEnabled: true,
    toggleAnimations: vi.fn(),
    chatBackground,
    setChatBackground,
  }
  render(
    <ThemeProvider theme={buildDefaultTheme('light', 'ltr')}>
      <CustomThemeContext value={context}>
        <SettingChatBackground />
      </CustomThemeContext>
    </ThemeProvider>,
  )
  return setChatBackground
}

describe('SettingChatBackground', () => {
  it('offers the default, every preset and a custom color, and shows which one is chosen', () => {
    renderSetting({ kind: 'preset', id: 'mint' })

    expect(screen.getByRole('button', { name: 'settings_chat_background_default' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'chat_background_mint' })).toHaveAttribute('aria-pressed', 'true')
    for (const id of ['sky', 'sand', 'rose', 'lavender', 'slate', 'sunrise', 'ocean', 'meadow', 'dusk']) {
      expect(screen.getByRole('button', { name: `chat_background_${id}` })).toHaveAttribute('aria-pressed', 'false')
    }
    expect(screen.getByRole('button', { name: 'settings_chat_background_custom' })).toBeInTheDocument()
  })

  it('chooses a preset or the default', async () => {
    const user = userEvent.setup()
    const setChatBackground = renderSetting({ kind: 'default' })

    await user.click(screen.getByRole('button', { name: 'chat_background_ocean' }))
    expect(setChatBackground).toHaveBeenLastCalledWith({ kind: 'preset', id: 'ocean' })

    await user.click(screen.getByRole('button', { name: 'settings_chat_background_default' }))
    expect(setChatBackground).toHaveBeenLastCalledWith({ kind: 'default' })
  })

  it('chooses the color picked in the color picker', () => {
    const setChatBackground = renderSetting({ kind: 'default' })

    fireEvent.change(screen.getByLabelText('settings_chat_background_custom', { selector: 'input' }), {
      target: { value: '#123456' },
    })

    expect(setChatBackground).toHaveBeenLastCalledWith({ kind: 'color', color: '#123456' })
  })
})
