/*
 * Copyright (C) 2022-2025 Savoir-faire Linux Inc.
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

import { WebSocketMessageTable, WebSocketMessageType } from '@savoirfairelinux/jami-web-common'

import { IWebSocketContext } from '../contexts/WebSocketProvider.js'
import { Account } from '../models/account.js'
import { CallData } from '../services/CallManager.js'
import { Listener } from '../utils/utils.js'

export type RTCPeerConnectionInfos = {
  remoteStreams: readonly MediaStream[]
  iceConnectionState: RTCIceConnectionState
}

export class RTCPeerConnectionHandler {
  private readonly connection: RTCPeerConnection
  private readonly webSocket: IWebSocketContext
  private readonly contactUri: string
  private readonly callData: CallData
  private remoteStreams: readonly MediaStream[] = []
  private iceConnectionState: RTCIceConnectionState = 'new'
  private isReadyForIceCandidates = false

  private isPolite = false // Implementing "perfect negotiation" pattern
  private makingOffer = false
  private ignoreOffer = false

  private audioRtcRtpSenders: RTCRtpSender[] | null = null
  private videoRtcRtpSenders: RTCRtpSender[] | null = null

  // TODO: The ICE candidate queue is used to cache candidates that were received before `setRemoteDescription` was
  //       called. This is currently necessary, because the jami-daemon is unreliable as a WebRTC signaling channel,
  //       because messages can be received with a delay or out of order. This queue is a temporary workaround that
  //       should be replaced if there is a better way to send messages with the daemon.
  //       Relevant links:
  //       - https://github.com/w3c/webrtc-pc/issues/2519#issuecomment-622055440
  //       - https://stackoverflow.com/questions/57256828/how-to-fix-invalidstateerror-cannot-add-ice-candidate-when-there-is-no-remote-s
  private iceCandidateQueue: RTCIceCandidate[] = []

  private listener: Listener

  getInfos(): RTCPeerConnectionInfos {
    return {
      remoteStreams: this.remoteStreams,
      iceConnectionState: this.iceConnectionState,
    }
  }

  constructor(
    webSocket: IWebSocketContext,
    account: Account,
    contactUri: string,
    callData: CallData,
    localStream: MediaStream | undefined,
    screenShareLocalStream: MediaStream | undefined,
    listener: Listener,
  ) {
    this.webSocket = webSocket
    this.contactUri = contactUri
    this.callData = callData
    this.isPolite = account.getUri() < contactUri
    this.listener = listener
    const iceServers = this.getIceServers(account)
    this.connection = new RTCPeerConnection({ iceServers })
    this.setConnectionListeners()
    this.updateLocalStreams(localStream, screenShareLocalStream)
  }

  updateLocalStreams(localStream: MediaStream | undefined, screenShareLocalStream: MediaStream | undefined) {
    if (this.connection.iceConnectionState === 'closed') {
      return
    }

    const updateTracks = async (stream: MediaStream, kind: 'audio' | 'video') => {
      const senders = kind === 'audio' ? this.audioRtcRtpSenders : this.videoRtcRtpSenders
      const tracks = kind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks()
      if (senders) {
        const promises: Promise<void>[] = []
        for (let i = 0; i < senders.length; i++) {
          const track = tracks[i] ?? null
          // This runs again on every connection change, also while a description is being negotiated: Chrome
          // aborts the page when a sender being renegotiated gets a track, even the one it already has.
          if (senders[i].track === track) {
            continue
          }
          // TODO: There is a bug where calling multiple times `addTrack` when changing an input device doesn't work.
          //       Calling `addTrack` doesn't trigger the `track` event listener for the other user.
          //       This workaround makes it possible to replace a track, but it could be improved by figuring out the
          //       proper way of changing a track.
          promises.push(
            senders[i].replaceTrack(track).catch((e) => {
              console.error('Error replacing track:', e)
            }),
          )
        }
        return Promise.all(promises)
      }

      // TODO: Currently, we do not support adding new devices. To enable this feature, we would need to implement
      //       the "Perfect negotiation" pattern to renegotiate after `addTrack`.
      //       https://blog.mozilla.org/webrtc/perfect-negotiation-in-webrtc/
      const newSenders = tracks.map((track) => this.connection.addTrack(track, stream))
      if (kind === 'audio') {
        this.audioRtcRtpSenders = newSenders
      } else {
        this.videoRtcRtpSenders = newSenders
      }
    }

    if (localStream) {
      updateTracks(localStream, 'audio')
      updateTracks(localStream, 'video')
    }

    if (screenShareLocalStream) {
      updateTracks(screenShareLocalStream, 'video')
    }
  }

  // The peer's offer or answer. The caller routes to each handler the signaling of its own peer.
  async receiveDescription(remoteDescription: RTCSessionDescriptionInit) {
    console.info('Received WebRTC description', remoteDescription)
    const offerCollision =
      remoteDescription.type === 'offer' && (this.makingOffer || this.connection.signalingState !== 'stable')

    this.ignoreOffer = !this.isPolite && offerCollision
    if (this.ignoreOffer) {
      return
    }

    await this.connection.setRemoteDescription(remoteDescription)
    if (remoteDescription.type === 'offer') {
      await this.sendLocalDescription()
    }
    await this.addQueuedIceCandidates()
  }

  async receiveIceCandidate(candidate: RTCIceCandidate | undefined) {
    if (!candidate) {
      return
    }

    if (this.isReadyForIceCandidates) {
      try {
        await this.connection.addIceCandidate(candidate)
      } catch (err) {
        if (!this.ignoreOffer) {
          console.error(err)
        }
      }
    } else {
      this.iceCandidateQueue.push(candidate)
    }
  }

  disconnect() {
    this.connection?.close()
    this.emitChange()
  }

  private getIceServers(account: Account) {
    const iceServers: RTCIceServer[] = []

    if (account.details['TURN.enable'] === 'true') {
      iceServers.push({
        urls: 'turn:' + account.details['TURN.server'],
        username: account.details['TURN.username'],
        credential: account.details['TURN.password'],
      })
    }

    if (account.details['STUN.enable'] === 'true') {
      iceServers.push({
        urls: 'stun:' + account.details['STUN.server'],
      })
    }

    return iceServers
  }

  private async sendLocalDescription() {
    await this.connection.setLocalDescription()
    const sdp = this.connection.localDescription
    if (sdp) {
      const webRtcDescription: WebSocketMessageTable['sendWebRtcDescription'] = {
        receiverId: this.contactUri,
        conversationId: this.callData.conversationId,
        sessionId: this.callData.sessionId,
        sdp,
      }
      this.webSocket.send(WebSocketMessageType.sendWebRtcDescription, webRtcDescription)
      console.info('Sending webRtcDescription', webRtcDescription)
    }
  }

  private async addQueuedIceCandidates() {
    console.info('WebRTC remote description has been set. Ready to receive ICE candidates')
    this.isReadyForIceCandidates = true
    if (this.iceCandidateQueue.length !== 0) {
      console.warn(
        'Found queued ICE candidates that were added before `setRemoteDescription` was called. ' +
          'Adding queued ICE candidates...',
        this.iceCandidateQueue,
      )

      await Promise.all(
        this.iceCandidateQueue.map((iceCandidate) => this.connection.addIceCandidate(iceCandidate)),
      ).catch((err) => {
        if (!this.ignoreOffer) {
          console.error(err)
        }
      })
    }
  }

  private setConnectionListeners() {
    this.connection.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true
        await this.sendLocalDescription()
      } catch (err) {
        // This is not an error if there was a collision
        console.warn(err)
      } finally {
        this.makingOffer = false
      }
    }

    this.connection.oniceconnectionstatechange = () => {
      if (this.connection.iceConnectionState === 'failed') {
        // This is not an error if there was a collision
        console.warn('ICE connection failed, restarting ICE')
        this.connection.restartIce()
      }
    }

    this.connection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        const webRtcIceCandidate: WebSocketMessageTable['sendWebRtcIceCandidate'] = {
          receiverId: this.contactUri,
          conversationId: this.callData.conversationId,
          sessionId: this.callData.sessionId,
          candidate: event.candidate,
        }

        // Send ice candidates as soon as they're found. This is called "trickle ice"
        this.webSocket.send(WebSocketMessageType.sendWebRtcIceCandidate, webRtcIceCandidate)
      }
    }

    this.connection.ontrack = (event: RTCTrackEvent) => {
      console.info('Received WebRTC event on track', event)
      this.remoteStreams = event.streams
      this.emitChange()
    }

    this.connection.oniceconnectionstatechange = (event: Event) => {
      console.info(`Received WebRTC event on iceconnectionstatechange: ${this.connection.iceConnectionState}`, event)
      this.iceConnectionState = this.connection.iceConnectionState
      this.emitChange()
    }
  }

  private emitChange() {
    this.listener()
  }
}
