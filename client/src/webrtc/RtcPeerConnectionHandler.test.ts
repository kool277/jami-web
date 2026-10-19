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
import { WebSocketMessageType } from '@savoirfairelinux/jami-web-common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IWebSocketContext } from '../contexts/WebSocketProvider.js'
import { Account } from '../models/account.js'
import { CallData } from '../services/CallManager.js'
import { FakeRTCPeerConnection, stream, track } from '../test/fakeWebRtc.js'
import { RTCPeerConnectionHandler } from './RtcPeerConnectionHandler.js'

function createHandler(localStream: MediaStream) {
  const webSocket = { bind: vi.fn(), unbind: vi.fn(), send: vi.fn() } as unknown as IWebSocketContext
  const account = { getUri: () => 'bob', details: {} } as unknown as Account
  const callData: CallData = { conversationId: 'conversation', withVideoOn: true, role: 'caller', sessionId: 'bob-1' }
  const handler = new RTCPeerConnectionHandler(webSocket, account, 'carol', callData, localStream, undefined, vi.fn())
  const connection = FakeRTCPeerConnection.instances.at(-1)!
  return { handler, connection, webSocket }
}

describe('RTCPeerConnectionHandler', () => {
  beforeEach(() => {
    FakeRTCPeerConnection.instances = []
    vi.stubGlobal('RTCPeerConnection', FakeRTCPeerConnection)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not replace the tracks the senders already send', () => {
    const localStream = stream([track('audio')], [track('video')])
    const { handler, connection } = createHandler(localStream)

    // React calls this again on every connection change, also while a description is being
    // negotiated, when Chrome aborts on a track set on a sender it is renegotiating.
    handler.updateLocalStreams(localStream, undefined)

    expect(connection.senders).toHaveLength(2)
    for (const sender of connection.senders) {
      expect(sender.replaceTrack).not.toHaveBeenCalled()
    }
  })

  it('replaces only the tracks that changed', () => {
    const audio = track('audio')
    const { handler, connection } = createHandler(stream([audio], [track('video')]))
    const newVideo = track('video')

    handler.updateLocalStreams(stream([audio], [newVideo]), undefined)

    const [audioSender, videoSender] = connection.senders
    expect(audioSender.replaceTrack).not.toHaveBeenCalled()
    expect(videoSender.replaceTrack).toHaveBeenCalledWith(newVideo)
  })

  it('answers an offer, telling the peer which session of this account answers', async () => {
    const { handler, connection, webSocket } = createHandler(stream([track('audio')], []))
    const offer: RTCSessionDescriptionInit = { type: 'offer', sdp: 'v=0' }

    await handler.receiveDescription(offer)

    expect(connection.setRemoteDescription).toHaveBeenCalledWith(offer)
    expect(webSocket.send).toHaveBeenCalledWith(WebSocketMessageType.sendWebRtcDescription, {
      receiverId: 'carol',
      conversationId: 'conversation',
      sessionId: 'bob-1',
      sdp: { type: 'answer', sdp: 'v=0 answer' },
    })
  })

  it('sends its ICE candidates with the session of this account', () => {
    const { connection, webSocket } = createHandler(stream([track('audio')], []))
    const candidate = { candidate: 'candidate:1 1 udp 1 192.0.2.1 9 typ host' } as RTCIceCandidate

    connection.onicecandidate?.({ candidate } as RTCPeerConnectionIceEvent)

    expect(webSocket.send).toHaveBeenCalledWith(WebSocketMessageType.sendWebRtcIceCandidate, {
      receiverId: 'carol',
      conversationId: 'conversation',
      sessionId: 'bob-1',
      candidate,
    })
  })
})
