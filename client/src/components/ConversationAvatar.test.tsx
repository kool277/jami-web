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
import { describe, expect, it, vi } from 'vitest'

import ConversationAvatar from './ConversationAvatar.js'

const contactQueries = vi.hoisted(() => ({
  useContactProfilePicture: vi.fn(),
}))

vi.mock('../services/contactQueries.js', () => ({
  useContactProfilePicture: contactQueries.useContactProfilePicture,
}))

describe('ConversationAvatar', () => {
  it('renders an explicit src prop without overriding it from the query', () => {
    contactQueries.useContactProfilePicture.mockReturnValue({ data: undefined })

    render(<ConversationAvatar displayName="Ada" contactUri="" src="data:image/png;base64,abc" />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', 'data:image/png;base64,abc')
  })

  it('falls back to the fetched profile picture when no explicit src is provided', () => {
    contactQueries.useContactProfilePicture.mockReturnValue({ data: 'blob:http://localhost/1234' })

    render(<ConversationAvatar displayName="Ada" contactUri="260d9aaee80c84ffda86bdc579a0be8d07a70b65" />)

    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', 'blob:http://localhost/1234')
  })
})
