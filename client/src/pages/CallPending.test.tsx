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
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CallStatus } from '../services/CallManager.js'
import { CallPendingCallerInterface, CallPendingReceiverInterface } from './CallPending.js'

const callManager = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))

vi.mock('../contexts/CallManagerProvider.js', () => ({ useCallManagerContext: () => callManager.value }))
vi.mock('../contexts/UserMediaProvider.js', () => ({ useUserMediaContext: () => ({}) }))
vi.mock('../contexts/ConversationProvider.js', async () => {
  const { ConversationMember } = await import('../models/conversation-member.js')
  const { Contact } = await import('../models/contact.js')
  const member = (uri: string, displayName: string) =>
    new ConversationMember('member', new Contact(uri, undefined, displayName))
  // The daemon lists the conversation's creator first: here, this account.
  const members = [member('bob', 'Bob'), member('carol', 'Carol'), member('dave', 'Dave')]
  return { useConversationContext: () => ({ members, conversationDisplayName: 'Carol, Dave' }) }
})
vi.mock('react-router-dom', () => ({ useLocation: () => ({ state: null }) }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { member0?: string }) => (options?.member0 ? `${key} ${options.member0}` : key),
  }),
}))

describe('CallPending', () => {
  beforeEach(() => {
    callManager.value = {}
  })

  it('names the conversation this account calls', () => {
    callManager.value = {
      callStatus: CallStatus.Ringing,
      callData: { conversationId: 'group', role: 'caller', sessionId: 'bob-1' },
    }

    render(<CallPendingCallerInterface />)

    expect(screen.getByRole('heading', { name: 'calling Carol, Dave' })).toBeInTheDocument()
  })

  it('names the member who calls this account', () => {
    callManager.value = {
      callStatus: CallStatus.Default,
      callData: { conversationId: 'group', role: 'receiver', sessionId: 'bob-1', callerUri: 'dave' },
    }

    render(<CallPendingReceiverInterface />)

    expect(screen.getByRole('heading', { name: 'incoming_call Dave' })).toBeInTheDocument()
  })
})
