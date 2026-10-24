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
import { ConversationMemberRole, WebSocketMessageTable, WebSocketMessageType } from '@savoirfairelinux/jami-web-common'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Contact } from '../models/contact.js'
import { ConversationMember } from '../models/conversation-member.js'
import { FakeRTCPeerConnection, stream, track } from '../test/fakeWebRtc.js'
import { CallStatus, useCallManager } from './CallManager.js'

// The providers the call manager reads, for the account bob. The WebSocket relays the messages a
// test plays to the listeners the call manager bound, as the web server does.
const mocks = vi.hoisted(() => {
  const listeners = new Map<string, Set<(data: unknown) => unknown>>()
  return {
    listeners,
    webSocket: {
      bind: (type: string, listener: (data: unknown) => unknown) => {
        listeners.set(type, (listeners.get(type) ?? new Set()).add(listener))
      },
      unbind: (type: string, listener: (data: unknown) => unknown) => {
        listeners.get(type)?.delete(listener)
      },
      send: vi.fn(),
    },
    account: { getUri: () => 'bob', details: {} },
    navigate: vi.fn(),
    setAlertContent: vi.fn(),
    members: [] as unknown[],
    userMedia: {} as Record<string, unknown>,
  }
})

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('../contexts/WebSocketProvider.js', () => ({ useWebSocketContext: () => mocks.webSocket }))
vi.mock('../contexts/AuthProvider.js', () => ({ useAuthContext: () => ({ account: mocks.account }) }))
vi.mock('../contexts/UserMediaProvider.js', () => ({ useUserMediaContext: () => mocks.userMedia }))
vi.mock('../contexts/AlertSnackbarProvider.js', async () => {
  const { createContext } = await import('react')
  return { AlertSnackbarContext: createContext({ setAlertContent: mocks.setAlertContent }) }
})
vi.mock('./conversationQueries.js', () => ({
  useConversationInfosQuery: () => ({ data: undefined }),
  useMembersQuery: () => ({ data: mocks.members }),
}))

mocks.userMedia = {
  localStream: stream([track('audio')], [track('video')]),
  screenShareLocalStream: undefined,
  updateLocalStream: vi.fn(async () => {}),
  updateScreenShare: vi.fn(async () => undefined),
  setAudioInputDeviceId: vi.fn(),
  setVideoDeviceId: vi.fn(),
  stopMedias: vi.fn(),
}

const member = (uri: string, role: ConversationMemberRole = 'member') => new ConversationMember(role, new Contact(uri))
const offer: RTCSessionDescriptionInit = { type: 'offer', sdp: 'v=0' }

// A message from another member, then whatever it set off.
async function receive<T extends WebSocketMessageType>(type: T, data: WebSocketMessageTable[T]) {
  await act(async () => {
    for (const listener of [...(mocks.listeners.get(type) ?? [])]) {
      listener(data)
    }
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

const sent = (type: WebSocketMessageType) =>
  mocks.webSocket.send.mock.calls.filter(([sentType]) => sentType === type).map(([, data]) => data)

const connections = () => FakeRTCPeerConnection.instances

async function changeIceConnectionState(connection: FakeRTCPeerConnection, state: RTCIceConnectionState) {
  await act(async () => {
    connection.changeIceConnectionState(state)
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

async function call(conversationId = 'group') {
  const hook = renderHook(() => useCallManager())
  await act(async () => hook.result.current.startCall(conversationId, true))
  return hook
}

describe('useCallManager', () => {
  beforeEach(() => {
    FakeRTCPeerConnection.instances = []
    vi.stubGlobal('RTCPeerConnection', FakeRTCPeerConnection)
    mocks.listeners.clear()
    mocks.webSocket.send.mockClear()
    mocks.navigate.mockClear()
    mocks.setAlertContent.mockClear()
    mocks.members = [member('bob', 'admin'), member('carol'), member('dave')]
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('when this account calls a group', () => {
    it('connects to every member who answers', async () => {
      const { result } = await call()
      expect(result.current.callStatus).toBe(CallStatus.Ringing)
      const sessionId = result.current.callData?.sessionId
      expect(sent(WebSocketMessageType.sendCallInvite)).toEqual([
        { conversationId: 'group', withVideoOn: true, sessionId },
      ])

      await receive(WebSocketMessageType.onCallJoin, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })
      await receive(WebSocketMessageType.onCallJoin, { conversationId: 'group', senderId: 'dave', sessionId: 'dave-1' })

      expect(result.current.callStatus).toBe(CallStatus.Connecting)
      expect(connections()).toHaveLength(2)
    })

    it('goes on when one participant leaves, and ends when the last one does', async () => {
      const { result } = await call()
      await receive(WebSocketMessageType.onCallJoin, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })
      await receive(WebSocketMessageType.onCallJoin, { conversationId: 'group', senderId: 'dave', sessionId: 'dave-1' })
      const [carol, dave] = connections()
      await changeIceConnectionState(carol, 'connected')
      expect(result.current.callStatus).toBe(CallStatus.InCall)

      await receive(WebSocketMessageType.onCallExit, { conversationId: 'group', senderId: 'dave', sessionId: 'dave-1' })
      expect(dave.close).toHaveBeenCalled()
      expect(carol.close).not.toHaveBeenCalled()
      expect(result.current.callStatus).toBe(CallStatus.InCall)

      await receive(WebSocketMessageType.onCallExit, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })
      expect(result.current.callData).toBeUndefined()
      expect(sent(WebSocketMessageType.sendCallExit)).toHaveLength(1)
    })

    it('keeps ringing until every member declines', async () => {
      const { result } = await call()

      await receive(WebSocketMessageType.onCallExit, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })
      expect(result.current.callStatus).toBe(CallStatus.Ringing)

      await receive(WebSocketMessageType.onCallExit, { conversationId: 'group', senderId: 'dave', sessionId: 'dave-1' })
      expect(result.current.callData).toBeUndefined()
    })

    it('ends a one-to-one call when the other member declines', async () => {
      mocks.members = [member('bob', 'admin'), member('carol')]
      const { result } = await call('one-to-one')

      await receive(WebSocketMessageType.onCallExit, { conversationId: 'one-to-one', senderId: 'carol' })

      expect(result.current.callData).toBeUndefined()
    })

    it('connects to a member who starts a call in the conversation of the call', async () => {
      const { result } = await call()
      await receive(WebSocketMessageType.onCallJoin, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })
      await changeIceConnectionState(connections()[0], 'connected')

      // dave missed the ringing and calls the group himself.
      await receive(WebSocketMessageType.onCallInvite, {
        conversationId: 'group',
        senderId: 'dave',
        sessionId: 'dave-1',
        withVideoOn: true,
      })

      expect(connections()).toHaveLength(2)
      expect(mocks.setAlertContent).not.toHaveBeenCalled()
      expect(result.current.callStatus).toBe(CallStatus.InCall)
    })

    it('connects again to a participant who comes back', async () => {
      const { result } = await call()
      await receive(WebSocketMessageType.onCallJoin, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })
      await receive(WebSocketMessageType.onCallJoin, { conversationId: 'group', senderId: 'dave', sessionId: 'dave-1' })
      const [first] = connections()

      // carol reloaded her page and joined again.
      await receive(WebSocketMessageType.onCallJoin, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-2',
      })
      const second = connections()[2]
      expect(first.close).toHaveBeenCalled()

      // The exit of her first session arrives late: she is still in the call.
      await receive(WebSocketMessageType.onCallExit, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })
      expect(second.close).not.toHaveBeenCalled()
      expect(result.current.callData).toBeDefined()
    })

    it('drops a participant who cannot be reached, and ends the call when nobody else can', async () => {
      const { result } = await call()
      await receive(WebSocketMessageType.onCallJoin, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })
      await receive(WebSocketMessageType.onCallJoin, { conversationId: 'group', senderId: 'dave', sessionId: 'dave-1' })
      const [carol, dave] = connections()
      await changeIceConnectionState(carol, 'connected')
      await changeIceConnectionState(dave, 'connected')

      await changeIceConnectionState(dave, 'failed')
      expect(dave.close).toHaveBeenCalled()
      expect(result.current.callStatus).toBe(CallStatus.InCall)

      await changeIceConnectionState(carol, 'disconnected')
      expect(result.current.callData).toBeUndefined()
    })

    it('shows the media of every participant', async () => {
      const { result } = await call()
      await receive(WebSocketMessageType.onCallJoin, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })
      await receive(WebSocketMessageType.onCallJoin, { conversationId: 'group', senderId: 'dave', sessionId: 'dave-1' })
      const [carol, dave] = connections()
      const carolStream = stream([track('audio')], [track('video')])
      const daveStream = stream([track('audio')], [track('video')])

      await act(async () => {
        carol.receiveStream(carolStream)
        dave.receiveStream(daveStream)
      })

      expect(result.current.remoteParticipants).toEqual([
        { uri: 'carol', stream: carolStream },
        { uri: 'dave', stream: daveStream },
      ])
    })
  })

  describe('when a member of a group calls this account', () => {
    const invite = { conversationId: 'group', senderId: 'carol', sessionId: 'carol-1', withVideoOn: true }

    it('rings, then connects to the members who reach out once it answers', async () => {
      const { result } = renderHook(() => useCallManager())
      await receive(WebSocketMessageType.onCallInvite, invite)
      expect(result.current.callData).toMatchObject({ conversationId: 'group', role: 'receiver', callerUri: 'carol' })
      expect(mocks.navigate).toHaveBeenCalledWith('/conversation/group')

      await act(async () => result.current.acceptCall(true))
      expect(result.current.callStatus).toBe(CallStatus.Connecting)
      const sessionId = result.current.callData?.sessionId
      expect(sent(WebSocketMessageType.sendCallJoin)).toEqual([{ conversationId: 'group', sessionId }])
      // Those in the call connect to this account when they hear it joined: it dials nobody.
      expect(connections()).toHaveLength(0)

      await receive(WebSocketMessageType.onWebRtcDescription, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
        sdp: offer,
      })
      await receive(WebSocketMessageType.onWebRtcDescription, {
        conversationId: 'group',
        senderId: 'dave',
        sessionId: 'dave-1',
        sdp: offer,
      })

      expect(connections()).toHaveLength(2)
      for (const connection of connections()) {
        expect(connection.setRemoteDescription).toHaveBeenCalledWith(offer)
      }
    })

    it('does not ring for an invite delivered long after it was sent', async () => {
      const { result } = renderHook(() => useCallManager())
      await receive(WebSocketMessageType.onCallInvite, { ...invite, sentAt: Date.now() - 3 * 60_000 })
      expect(result.current.callData).toBeUndefined()

      await receive(WebSocketMessageType.onCallInvite, { ...invite, sentAt: Date.now() - 5_000 })
      expect(result.current.callData).toMatchObject({ conversationId: 'group', role: 'receiver' })
    })

    it('ignores an answer from a session it has no connection with', async () => {
      const { result } = renderHook(() => useCallManager())
      await receive(WebSocketMessageType.onCallInvite, invite)
      await act(async () => result.current.acceptCall(true))

      await receive(WebSocketMessageType.onWebRtcDescription, {
        conversationId: 'group',
        senderId: 'dave',
        sessionId: 'dave-1',
        sdp: { type: 'answer', sdp: 'v=0' },
      })

      expect(connections()).toHaveLength(0)
    })

    it('stops ringing when the caller hangs up before anyone answers', async () => {
      const { result } = renderHook(() => useCallManager())
      await receive(WebSocketMessageType.onCallInvite, invite)

      await receive(WebSocketMessageType.onCallExit, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })

      expect(result.current.callData).toBeUndefined()
    })

    it('keeps ringing while a member who answered is still in the call', async () => {
      const { result } = renderHook(() => useCallManager())
      await receive(WebSocketMessageType.onCallInvite, invite)
      await receive(WebSocketMessageType.onCallJoin, { conversationId: 'group', senderId: 'dave', sessionId: 'dave-1' })

      await receive(WebSocketMessageType.onCallExit, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })

      expect(result.current.callData).toMatchObject({ conversationId: 'group', role: 'receiver' })
    })
  })

  describe('when the device of a member on the desktop or mobile apps hosts the call', () => {
    const invite = {
      conversationId: 'group',
      senderId: 'frank',
      sessionId: 'frank-1',
      withVideoOn: true,
      hosted: true,
      trickleIce: false,
    }

    it('connects to the host alone, and ends with it', async () => {
      const { result } = renderHook(() => useCallManager())
      await receive(WebSocketMessageType.onCallInvite, invite)
      expect(result.current.callData).toMatchObject({ conversationId: 'group', role: 'receiver', hostUri: 'frank' })
      await act(async () => result.current.acceptCall(true))
      expect(sent(WebSocketMessageType.sendCallJoin)).toHaveLength(1)

      // Another member joins or reaches out: the host connects it, not this account.
      await receive(WebSocketMessageType.onCallJoin, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })
      await receive(WebSocketMessageType.onWebRtcDescription, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
        sdp: offer,
      })
      expect(connections()).toHaveLength(0)

      await receive(WebSocketMessageType.onWebRtcDescription, {
        conversationId: 'group',
        senderId: 'frank',
        sessionId: 'frank-1',
        trickleIce: false,
        sdp: offer,
      })
      expect(connections()).toHaveLength(1)

      // A member leaving does not end it; the host leaving does.
      await receive(WebSocketMessageType.onCallExit, {
        conversationId: 'group',
        senderId: 'carol',
        sessionId: 'carol-1',
      })
      expect(result.current.callData).toBeDefined()
      await receive(WebSocketMessageType.onCallExit, {
        conversationId: 'group',
        senderId: 'frank',
        sessionId: 'frank-1',
      })
      expect(result.current.callData).toBeUndefined()
    })
  })

  describe('with a member on the desktop or mobile apps', () => {
    it('offers it every candidate in the description, not one by one', async () => {
      await call('one-to-one')
      await receive(WebSocketMessageType.onCallJoin, {
        conversationId: 'one-to-one',
        senderId: 'carol',
        sessionId: 'carol-1',
        trickleIce: false,
      })
      const [connection] = connections()

      // The offer waits for the candidates: not awaited here.
      act(() => {
        void connection.onnegotiationneeded?.()
      })
      await vi.waitFor(() => expect(connection.setLocalDescription).toHaveBeenCalled())
      connection.onicecandidate?.({ candidate: { candidate: 'candidate:1' } } as RTCPeerConnectionIceEvent)
      expect(sent(WebSocketMessageType.sendWebRtcDescription)).toEqual([])
      expect(sent(WebSocketMessageType.sendWebRtcIceCandidate)).toEqual([])

      await act(async () => connection.finishGathering())
      await vi.waitFor(() => expect(sent(WebSocketMessageType.sendWebRtcDescription)).toHaveLength(1))
    })
  })
})
