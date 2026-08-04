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
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { buildDefaultTheme } from '../themes/Default.js'
import { ConversationRequestList } from './ConversationRequestList.js'
import { EmptyInvitations } from './InviteList.js'

const hash = '260d9aaee80c84ffda86bdc579a0be8d07a70b65'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../services/conversationQueries.js', () => ({
  useConversationRequestsQuery: () => ({
    data: [
      {
        conversationId: 'request-1',
        infos: { title: '' },
        from: { uri: hash, registeredName: '' },
        received: '2026-08-04T12:00:00Z',
        membersNames: [hash],
      },
    ],
  }),
}))

vi.mock('./ConversationAvatar.js', () => ({
  default: ({ displayName }: { displayName: string }) => <span aria-hidden="true">{displayName}</span>,
}))

vi.mock('./EllipsisMiddle.js', () => ({
  default: ({ text }: { text: string }) => <span data-testid="invite-name">{text}</span>,
}))

describe('EmptyInvitations', () => {
  it('explains when there are no pending invitations', () => {
    render(
      <ThemeProvider theme={buildDefaultTheme('light', 'ltr')}>
        <EmptyInvitations />
      </ThemeProvider>,
    )

    expect(screen.getByRole('heading', { name: 'invitations_empty' })).toBeVisible()
    expect(screen.getByText('invitations_empty_description')).toBeVisible()
  })
})

describe('ConversationRequestList', () => {
  it('opens an invite in the detail route instead of a dialog', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider theme={buildDefaultTheme('light', 'ltr')}>
        <MemoryRouter>
          <ConversationRequestList />
          <CurrentPath />
        </MemoryRouter>
      </ThemeProvider>,
    )

    expect(screen.getByTestId('invite-name')).toHaveTextContent(hash)

    await user.click(screen.getByRole('button', { name: hash }))

    expect(screen.getByTestId('current-path')).toHaveTextContent('/invites/request-1')
    expect(document.querySelector('.MuiDialog-root')).not.toBeInTheDocument()
  })
})

function CurrentPath() {
  const { pathname } = useLocation()
  return <output data-testid="current-path">{pathname}</output>
}
