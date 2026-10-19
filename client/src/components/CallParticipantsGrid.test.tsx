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

import { Contact } from '../models/contact.js'
import { ConversationMember } from '../models/conversation-member.js'
import { stream, track } from '../test/fakeWebRtc.js'
import CallParticipantsGrid from './CallParticipantsGrid.js'
import { RemoteVideoOverlay } from './VideoOverlay.js'

const callManager = vi.hoisted(() => ({ value: {} as Record<string, unknown> }))

vi.mock('../contexts/CallManagerProvider.js', () => ({ useCallManagerContext: () => callManager.value }))
vi.mock('../contexts/UserMediaProvider.js', () => ({
  useUserMediaContext: () => ({ currentMediaDeviceIds: { audiooutput: { id: undefined } } }),
}))
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

const member = (uri: string, displayName: string) =>
  new ConversationMember('member', new Contact(uri, undefined, displayName))
const carol = stream([track('audio')], [track('video')])
const dave = stream([track('audio')], [track('video')])

describe('CallParticipantsGrid', () => {
  it('shows every participant, this account included, and plays the sound of the others', () => {
    callManager.value = {
      callMembers: [member('bob', 'Bob'), member('carol', 'Carol'), member('dave', 'Dave')],
      remoteParticipants: [
        { uri: 'carol', stream: carol },
        { uri: 'dave', stream: dave },
      ],
    }
    const local = stream([track('audio')], [track('video')])

    render(<CallParticipantsGrid localStream={local} audioOutDeviceId={undefined} />)

    const tiles = screen.getAllByRole('figure')
    expect(tiles.map((tile) => tile.textContent)).toEqual(['Carol', 'Dave', 'yourself'])
    const videos = tiles.map((tile) => tile.querySelector('video'))
    expect(videos.map((video) => video?.srcObject)).toEqual([carol, dave, local])
    expect(videos.map((video) => video?.muted)).toEqual([false, false, true])
  })

  it('shows this account without video when its camera is off', () => {
    callManager.value = {
      callMembers: [member('carol', 'Carol'), member('dave', 'Dave')],
      remoteParticipants: [
        { uri: 'carol', stream: carol },
        { uri: 'dave', stream: dave },
      ],
    }

    render(<CallParticipantsGrid localStream={undefined} audioOutDeviceId={undefined} />)

    const ownTile = screen.getAllByRole('figure').at(-1)
    expect(ownTile).toHaveTextContent('yourself')
    expect(ownTile?.querySelector('video')).toBeNull()
  })
})

describe('RemoteVideoOverlay', () => {
  it('plays the sound of every participant of a group call while another conversation is open', () => {
    callManager.value = {
      remoteParticipants: [
        { uri: 'carol', stream: carol },
        { uri: 'dave', stream: dave },
      ],
    }

    const { container } = render(<RemoteVideoOverlay callConversationId="group" />)

    const videos = [...container.querySelectorAll('video')]
    expect(videos.map((video) => video.srcObject)).toEqual([carol, dave])
    expect(videos.some((video) => video.muted)).toBe(false)
  })
})
