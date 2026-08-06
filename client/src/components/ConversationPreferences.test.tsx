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
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

const { popperSpy } = vi.hoisted(() => ({ popperSpy: vi.fn() }))

vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mui/material')>()

  return {
    ...actual,
    Popper: ({ children, ...props }: { children: ReactNode; open: boolean }) => {
      popperSpy(props)
      return props.open ? children : null
    },
  }
})

vi.mock('../contexts/ConversationPreferencesColorContext.js', () => ({
  useConversationPreferencesColorContext: () => ({ conversationColor: '#000000' }),
}))

vi.mock('../services/conversationQueries.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/conversationQueries.js')>()

  return {
    ...actual,
    useConversationPreferencesMutation: () => ({ mutate: vi.fn() }),
  }
})

import { ColorPicker, getConversationPreferencesTransition, getConversationType } from './ConversationPreferences.js'

describe('ConversationPreferences', () => {
  it('slides without bouncing and respects disabled animations', () => {
    expect(getConversationPreferencesTransition(true)).toEqual({
      type: 'tween',
      duration: 0.2,
      ease: 'easeOut',
    })
    expect(getConversationPreferencesTransition(false)).toEqual({ duration: 0 })
  })

  it('identifies direct and group conversations from their member count', () => {
    expect(getConversationType(2)).toBe('private')
    expect(getConversationType(3)).toBe('group')
  })

  it('opens the color picker above the preferences panel', async () => {
    const user = userEvent.setup()
    render(<ColorPicker conversationId="conversation-id" />)

    await user.click(screen.getByRole('button'))

    expect(popperSpy).toHaveBeenLastCalledWith(expect.objectContaining({ sx: { zIndex: 2 } }))
  })

  it('closes the color picker when clicking outside', async () => {
    const user = userEvent.setup()
    render(<ColorPicker conversationId="conversation-id" />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()

    await user.click(document.body)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('reopens the color picker at its trigger after clicking outside', async () => {
    const user = userEvent.setup()
    render(<ColorPicker conversationId="conversation-id" />)
    const colorButton = screen.getByRole('button')

    await user.click(colorButton)
    await user.click(document.body)
    await user.click(colorButton)

    expect(popperSpy).toHaveBeenLastCalledWith(expect.objectContaining({ anchorEl: colorButton, open: true }))
  })
})
