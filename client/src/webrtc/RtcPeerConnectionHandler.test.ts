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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IWebSocketContext } from '../contexts/WebSocketProvider.js'
import { Account } from '../models/account.js'
import { CallData } from '../services/CallManager.js'
import { RTCPeerConnectionHandler } from './RtcPeerConnectionHandler.js'

type FakeSender = { track: MediaStreamTrack | null; replaceTrack: ReturnType<typeof vi.fn> }

class FakeRTCPeerConnection {
  iceConnectionState = 'new'
  signalingState = 'stable'
  localDescription = null
  senders: FakeSender[] = []

  addTrack(track: MediaStreamTrack) {
    const sender: FakeSender = {
      track,
      replaceTrack: vi.fn(async (newTrack: MediaStreamTrack | null) => {
        sender.track = newTrack
      }),
    }
    this.senders.push(sender)
    return sender
  }
}

const track = (kind: 'audio' | 'video') => ({ kind }) as MediaStreamTrack
const stream = (audio: MediaStreamTrack[], video: MediaStreamTrack[]) =>
  ({ getAudioTracks: () => audio, getVideoTracks: () => video }) as unknown as MediaStream

function createHandler(localStream: MediaStream) {
  const webSocket = { bind: vi.fn(), unbind: vi.fn(), send: vi.fn() } as unknown as IWebSocketContext
  const account = { getUri: () => 'bob', details: {} } as unknown as Account
  const callData = { conversationId: 'conversation', withVideoOn: true, role: 'caller' } as CallData
  const handler = new RTCPeerConnectionHandler(webSocket, account, 'carol', callData, localStream, undefined, vi.fn())
  // The handler keeps its connection private: reach it to inspect the senders.
  const connection = (handler as unknown as { connection: FakeRTCPeerConnection }).connection
  return { handler, connection }
}

describe('RTCPeerConnectionHandler', () => {
  beforeEach(() => {
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
})
