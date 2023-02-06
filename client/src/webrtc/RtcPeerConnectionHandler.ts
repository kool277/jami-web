/*
 * Copyright (C) 2022 Savoir-faire Linux Inc.
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

import { WebRtcIceCandidate, WebRtcSdp, WebSocketMessageTable, WebSocketMessageType } from 'jami-web-common';

import { CallData } from '../contexts/CallProvider';
import { IWebSocketContext } from '../contexts/WebSocketProvider';
import { Account } from '../models/account';
import { Listener } from '../utils/utils';

export type RTCPeerConnectionInfos = {
  remoteStreams: readonly MediaStream[];
  iceConnectionState: RTCIceConnectionState;
};

export class RTCPeerConnectionHandler {
  private readonly connection: RTCPeerConnection;
  private remoteStreams: readonly MediaStream[] = [];
  private iceConnectionState: RTCIceConnectionState = 'new';
  private isReadyForIceCandidates = false;

  private audioRtcRtpSenders: RTCRtpSender[] | null = null;
  private videoRtcRtpSenders: RTCRtpSender[] | null = null;

  // TODO: The ICE candidate queue is used to cache candidates that were received before `setRemoteDescription` was
  //       called. This is currently necessary, because the jami-daemon is unreliable as a WebRTC signaling channel,
  //       because messages can be received with a delay or out of order. This queue is a temporary workaround that
  //       should be replaced if there is a better way to send messages with the daemon.
  //       Relevant links:
  //       - https://github.com/w3c/webrtc-pc/issues/2519#issuecomment-622055440
  //       - https://stackoverflow.com/questions/57256828/how-to-fix-invalidstateerror-cannot-add-ice-candidate-when-there-is-no-remote-s
  private iceCandidateQueue: RTCIceCandidate[] = [];

  private cleaningFunctions: (() => void)[] = [];
  private listener: Listener;

  getInfos(): RTCPeerConnectionInfos {
    return {
      remoteStreams: this.remoteStreams,
      iceConnectionState: this.iceConnectionState,
    };
  }

  constructor(
    webSocket: IWebSocketContext,
    account: Account,
    contactUri: string,
    callData: CallData,
    localStream: MediaStream | undefined,
    screenShareLocalStream: MediaStream | undefined,
    listener: Listener
  ) {
    console.log('constructor', callData);
    this.listener = listener;
    const iceServers = this.getIceServers(account);
    this.connection = new RTCPeerConnection({ iceServers });
    this.setConnectionListeners(webSocket, callData.conversationId, contactUri);
    this.setWebSocketListeners(webSocket, callData.conversationId, contactUri);
    this.updateLocalStreams(localStream, screenShareLocalStream);

    if (callData.role === 'caller') {
      this.startNegociation(webSocket, contactUri, callData.conversationId);
    }
  }

  updateLocalStreams(localStream: MediaStream | undefined, screenShareLocalStream: MediaStream | undefined) {
    if (this.connection.iceConnectionState === 'closed') {
      return;
    }

    const updateTracks = async (stream: MediaStream, kind: 'audio' | 'video') => {
      const senders = kind === 'audio' ? this.audioRtcRtpSenders : this.videoRtcRtpSenders;
      const tracks = kind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();
      if (senders) {
        const promises: Promise<void>[] = [];
        for (let i = 0; i < senders.length; i++) {
          // TODO: There is a bug where calling multiple times `addTrack` when changing an input device doesn't work.
          //       Calling `addTrack` doesn't trigger the `track` event listener for the other user.
          //       This workaround makes it possible to replace a track, but it could be improved by figuring out the
          //       proper way of changing a track.
          promises.push(
            senders[i].replaceTrack(tracks[i]).catch((e) => {
              console.error('Error replacing track:', e);
            })
          );
        }
        return Promise.all(promises);
      }

      // TODO: Currently, we do not support adding new devices. To enable this feature, we would need to implement
      //       the "Perfect negotiation" pattern to renegotiate after `addTrack`.
      //       https://blog.mozilla.org/webrtc/perfect-negotiation-in-webrtc/
      const newSenders = tracks.map((track) => this.connection.addTrack(track, stream));
      if (kind === 'audio') {
        this.audioRtcRtpSenders = newSenders;
      } else {
        this.videoRtcRtpSenders = newSenders;
      }
    };

    if (localStream) {
      updateTracks(localStream, 'audio');
      updateTracks(localStream, 'video');
    }

    if (screenShareLocalStream) {
      updateTracks(screenShareLocalStream, 'video');
    }
  }

  disconnect() {
    this.connection?.close();
    this.cleaningFunctions.forEach((func) => func());
    this.cleaningFunctions = [];
    this.emitChange();
  }

  private getIceServers(account: Account) {
    const iceServers: RTCIceServer[] = [];

    if (account.details['TURN.enable'] === 'true') {
      iceServers.push({
        urls: 'turn:' + account.details['TURN.server'],
        username: account.details['TURN.username'],
        credential: account.details['TURN.password'],
      });
    }

    if (account.details['STUN.enable'] === 'true') {
      iceServers.push({
        urls: 'stun:' + account.details['STUN.server'],
      });
    }

    return iceServers;
  }

  private startNegociation(webSocket: IWebSocketContext, contactUri: string, conversationId: string) {
    this.sendWebRtcOffer(webSocket, contactUri, conversationId);
  }

  private async sendWebRtcOffer(webSocket: IWebSocketContext, contactUri: string, conversationId: string) {
    const sdp = await this.connection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    const webRtcOffer: WebSocketMessageTable['sendWebRtcOffer'] = {
      receiverId: contactUri,
      conversationId: conversationId,
      sdp,
    };

    await this.connection.setLocalDescription(new RTCSessionDescription(sdp));
    console.info('Sending WebRtcOffer', webRtcOffer);
    webSocket.send(WebSocketMessageType.sendWebRtcOffer, webRtcOffer);
  }

  private setWebSocketListeners(webSocket: IWebSocketContext, conversationId: string, contactUri: string) {
    const sendWebRtcAnswer = async () => {
      const sdp = await this.connection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      const webRtcAnswer: WebSocketMessageTable['sendWebRtcAnswer'] = {
        receiverId: contactUri,
        conversationId: conversationId,
        sdp,
      };

      await this.connection.setLocalDescription(new RTCSessionDescription(sdp));
      console.info('Sending WebRtcAnswer', webRtcAnswer);
      webSocket.send(WebSocketMessageType.sendWebRtcAnswer, webRtcAnswer);
    };

    const addQueuedIceCandidates = async () => {
      console.info('WebRTC remote description has been set. Ready to receive ICE candidates');
      this.isReadyForIceCandidates = true;
      if (this.iceCandidateQueue.length !== 0) {
        console.warn(
          'Found queued ICE candidates that were added before `setRemoteDescription` was called. ' +
            'Adding queued ICE candidates...',
          this.iceCandidateQueue
        );

        await Promise.all(this.iceCandidateQueue.map((iceCandidate) => this.connection.addIceCandidate(iceCandidate)));
      }
    };

    const webRtcOfferListener = async (data: WebRtcSdp) => {
      console.debug('receive webrtcoffer');
      console.info('Received event on WebRtcOffer', data);
      if (data.conversationId !== conversationId) {
        console.warn('Wrong incoming conversationId, ignoring action');
        return;
      }

      await this.connection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      await sendWebRtcAnswer();
      await addQueuedIceCandidates();
    };

    const webRtcAnswerListener = async (data: WebRtcSdp) => {
      console.info('Received event on WebRtcAnswer', data);
      if (data.conversationId !== conversationId) {
        console.warn('Wrong incoming conversationId, ignoring action');
        return;
      }

      await this.connection.setRemoteDescription(new RTCSessionDescription(data.sdp));
      await addQueuedIceCandidates();
    };

    const webRtcIceCandidateListener = async (data: WebRtcIceCandidate) => {
      if (data.conversationId !== conversationId) {
        console.warn('Wrong incoming conversationId, ignoring action');
        return;
      }

      if (!data.candidate) {
        return;
      }

      if (this.isReadyForIceCandidates) {
        await this.connection.addIceCandidate(data.candidate);
      } else {
        this.iceCandidateQueue.push(data.candidate);
      }
    };

    webSocket.bind(WebSocketMessageType.onWebRtcOffer, webRtcOfferListener);
    webSocket.bind(WebSocketMessageType.onWebRtcAnswer, webRtcAnswerListener);
    webSocket.bind(WebSocketMessageType.onWebRtcIceCandidate, webRtcIceCandidateListener);

    this.cleaningFunctions.push(() => {
      webSocket.unbind(WebSocketMessageType.onWebRtcOffer, webRtcOfferListener);
      webSocket.unbind(WebSocketMessageType.onWebRtcAnswer, webRtcAnswerListener);
      webSocket.unbind(WebSocketMessageType.onWebRtcIceCandidate, webRtcIceCandidateListener);
    });
  }

  private setConnectionListeners(webSocket: IWebSocketContext, conversationId: string, contactUri: string) {
    this.connection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        const webRtcIceCandidate: WebSocketMessageTable['sendWebRtcIceCandidate'] = {
          receiverId: contactUri,
          conversationId: conversationId,
          candidate: event.candidate,
        };

        // Send ice candidates as soon as they're found. This is called "trickle ice"
        webSocket.send(WebSocketMessageType.sendWebRtcIceCandidate, webRtcIceCandidate);
      }
    };

    this.connection.ontrack = (event: RTCTrackEvent) => {
      console.info('Received WebRTC event on track', event);
      this.remoteStreams = event.streams;
      this.emitChange();
    };

    this.connection.oniceconnectionstatechange = (event: Event) => {
      console.info(`Received WebRTC event on iceconnectionstatechange: ${this.connection.iceConnectionState}`, event);
      this.iceConnectionState = this.connection.iceConnectionState;
      this.emitChange();
    };
  }

  private emitChange() {
    this.listener();
  }
}
