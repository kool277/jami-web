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
import { vi } from 'vitest'

export type FakeSender = { track: MediaStreamTrack | null; replaceTrack: ReturnType<typeof vi.fn> }

/**
 * The parts of RTCPeerConnection the call code uses. jsdom has no WebRTC: stub the global with
 * this class, then read `instances` to see which connections the code opened.
 */
export class FakeRTCPeerConnection {
  static instances: FakeRTCPeerConnection[] = []

  iceConnectionState: RTCIceConnectionState = 'new'
  signalingState: RTCSignalingState = 'stable'
  localDescription: RTCSessionDescriptionInit | null = null
  senders: FakeSender[] = []
  onnegotiationneeded: (() => void) | null = null
  oniceconnectionstatechange: ((event: Event) => void) | null = null
  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null = null
  ontrack: ((event: RTCTrackEvent) => void) | null = null

  setRemoteDescription = vi.fn(async (description: RTCSessionDescriptionInit) => {
    this.signalingState = description.type === 'offer' ? 'have-remote-offer' : 'stable'
  })
  setLocalDescription = vi.fn(async () => {
    const type = this.signalingState === 'have-remote-offer' ? 'answer' : 'offer'
    this.localDescription = { type, sdp: `v=0 ${type}` }
    this.signalingState = type === 'answer' ? 'stable' : 'have-local-offer'
  })
  addIceCandidate = vi.fn(async () => {})
  restartIce = vi.fn()
  close = vi.fn(() => {
    this.iceConnectionState = 'closed'
    this.signalingState = 'closed'
  })

  constructor() {
    FakeRTCPeerConnection.instances.push(this)
  }

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

  // What the browser does when the connection to the peer comes up, drops or fails.
  changeIceConnectionState(state: RTCIceConnectionState) {
    this.iceConnectionState = state
    this.oniceconnectionstatechange?.(new Event('iceconnectionstatechange'))
  }

  // What the browser does when the peer's media arrives.
  receiveStream(stream: MediaStream) {
    this.ontrack?.({ streams: [stream] } as unknown as RTCTrackEvent)
  }
}

export const track = (kind: 'audio' | 'video') =>
  ({ kind, enabled: true, getSettings: () => ({}) }) as unknown as MediaStreamTrack

export const stream = (audio: MediaStreamTrack[], video: MediaStreamTrack[]) =>
  ({
    getAudioTracks: () => audio,
    getVideoTracks: () => video,
    getTracks: () => [...audio, ...video],
  }) as unknown as MediaStream
