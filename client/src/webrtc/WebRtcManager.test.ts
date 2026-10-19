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
import { FakeRTCPeerConnection, stream, track } from '../test/fakeWebRtc.js'
import { WebRtcManager } from './WebRtcManager.js'

const webSocket = { bind: vi.fn(), unbind: vi.fn(), send: vi.fn() } as unknown as IWebSocketContext
const account = { getUri: () => 'bob', details: {} } as unknown as Account
const callData: CallData = { conversationId: 'group', role: 'caller', withVideoOn: true, sessionId: 'bob-1' }
const offer: RTCSessionDescriptionInit = { type: 'offer', sdp: 'v=0' }
const answer: RTCSessionDescriptionInit = { type: 'answer', sdp: 'v=0' }
const candidate = { candidate: 'candidate:1 1 udp 1 192.0.2.1 9 typ host' } as RTCIceCandidate

function connect(manager: WebRtcManager, contactUri: string, sessionId: string | undefined) {
  manager.addConnection(webSocket, account, contactUri, callData, stream([track('audio')], []), undefined, sessionId)
  return FakeRTCPeerConnection.instances.at(-1)!
}

describe('WebRtcManager', () => {
  beforeEach(() => {
    FakeRTCPeerConnection.instances = []
    vi.stubGlobal('RTCPeerConnection', FakeRTCPeerConnection)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('gives each description to the connection of the participant who sent it', async () => {
    const manager = new WebRtcManager()
    const carol = connect(manager, 'carol', 'carol-1')
    const dave = connect(manager, 'dave', 'dave-1')

    await manager.receiveDescription('dave', 'dave-1', offer)

    expect(dave.setRemoteDescription).toHaveBeenCalledWith(offer)
    expect(carol.setRemoteDescription).not.toHaveBeenCalled()
  })

  it('leaves out the signaling of a session it has no connection with', async () => {
    const manager = new WebRtcManager()
    const carol = connect(manager, 'carol', 'carol-2')
    await manager.receiveDescription('carol', 'carol-2', offer)

    // carol's previous attempt at the call, delivered late
    await manager.receiveDescription('carol', 'carol-1', answer)
    await manager.receiveIceCandidate('carol', 'carol-1', candidate)

    expect(carol.setRemoteDescription).toHaveBeenCalledTimes(1)
    expect(carol.addIceCandidate).not.toHaveBeenCalled()
    expect(manager.hasSession('carol', 'carol-1')).toBe(false)
    expect(manager.hasSession('carol', 'carol-2')).toBe(true)
  })

  it('replaces the connection of a participant who comes back with a new session', () => {
    const manager = new WebRtcManager()
    const first = connect(manager, 'carol', 'carol-1')
    const second = connect(manager, 'carol', 'carol-2')

    expect(first.close).toHaveBeenCalled()
    expect(second.close).not.toHaveBeenCalled()
    expect(manager.hasSession('carol', 'carol-2')).toBe(true)
  })

  it('keeps the connection when the same session connects again', () => {
    const manager = new WebRtcManager()
    const first = connect(manager, 'carol', 'carol-1')
    connect(manager, 'carol', 'carol-1')

    expect(FakeRTCPeerConnection.instances).toEqual([first])
    expect(first.close).not.toHaveBeenCalled()
  })

  it('holds the ICE candidates a session sends before its connection exists', async () => {
    const manager = new WebRtcManager()

    // The daemon can deliver a candidate before the offer it goes with.
    await manager.receiveIceCandidate('carol', 'carol-1', candidate)
    const carol = connect(manager, 'carol', 'carol-1')
    await manager.receiveDescription('carol', 'carol-1', offer)

    expect(carol.addIceCandidate).toHaveBeenCalledWith(candidate)
  })

  it('removes a connection and tells its subscribers', () => {
    const manager = new WebRtcManager()
    const listener = vi.fn()
    manager.subscribe(listener)
    const carol = connect(manager, 'carol', 'carol-1')

    manager.removeConnection('carol')

    expect(carol.close).toHaveBeenCalled()
    expect(manager.hasConnection('carol')).toBe(false)
    expect(manager.getSnapshot()).toEqual({})
    expect(listener).toHaveBeenCalled()
  })

  it('removes the connections whose peer cannot be reached anymore', () => {
    const manager = new WebRtcManager()
    const carol = connect(manager, 'carol', 'carol-1')
    connect(manager, 'dave', 'dave-1')

    carol.changeIceConnectionState('failed')

    expect(manager.removeLostConnections()).toEqual(['carol'])
    expect(manager.hasConnection('carol')).toBe(false)
    expect(manager.hasConnection('dave')).toBe(true)
    expect(manager.removeLostConnections()).toEqual([])
  })
})
