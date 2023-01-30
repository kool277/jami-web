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

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createOptionalContext } from '../hooks/createOptionalContext';
import { ConversationMember } from '../models/conversation-member';
import { WithChildren } from '../utils/utils';
import { useWebRtcManager } from '../webrtc/WebRtcManager';
import { useAuthContext } from './AuthProvider';
import { CallData, CallManagerContext } from './CallManagerProvider';
import ConditionalContextProvider from './ConditionalContextProvider';
import { IWebSocketContext, WebSocketContext } from './WebSocketProvider';

export type MediaDevicesInfo = Record<MediaDeviceKind, MediaDeviceInfo[]>;
export type MediaInputKind = 'audio' | 'video';
export type MediaInputIds = Record<MediaInputKind, string | false | undefined>;

export interface IWebRtcContext {
  iceConnectionState: RTCIceConnectionState | undefined;

  localStream: MediaStream | undefined;
  screenShareLocalStream: MediaStream | undefined;
  remoteStreams: readonly MediaStream[];
  getMediaDevices: () => Promise<MediaDevicesInfo>;
  updateLocalStream: (mediaDeviceIds?: MediaInputIds) => Promise<void>;
  updateScreenShare: (active: boolean) => Promise<MediaStream | undefined>;

  sendWebRtcOffer: () => Promise<void>;
  closeConnection: () => void;
}

const optionalWebRtcContext = createOptionalContext<IWebRtcContext>('WebRtcContext');
export const useWebRtcContext = optionalWebRtcContext.useOptionalContext;

export default ({ children }: WithChildren) => {
  const webSocket = useContext(WebSocketContext);
  const { callConversationInfos, callMembers, callData } = useContext(CallManagerContext);

  const dependencies = useMemo(
    () => ({
      webSocket,
      conversationInfos: callConversationInfos,
      members: callMembers,
      callData: callData,
    }),
    [webSocket, callConversationInfos, callMembers, callData]
  );

  return (
    <ConditionalContextProvider
      Context={optionalWebRtcContext.Context}
      initialValue={undefined}
      dependencies={dependencies}
      useProviderValue={useWebRtcContextValue}
    >
      {children}
    </ConditionalContextProvider>
  );
};

const useWebRtcContextValue = ({
  members,
  callData,
  webSocket,
}: {
  webSocket: IWebSocketContext;
  members: ConversationMember[];
  callData: CallData;
}) => {
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [screenShareLocalStream, setScreenShareLocalStream] = useState<MediaStream>();
  const { account } = useAuthContext();
  const webRtcManager = useWebRtcManager();

  // TODO: This logic will have to change to support multiple people in a call
  const contactUri = members[0]?.contact.uri;
  const connectionInfos = webRtcManager.connectionsInfos[contactUri];
  const remoteStreams = connectionInfos?.remoteStreams;
  const iceConnectionState = connectionInfos?.iceConnectionState;

  // TODO: Replace this by a callback
  useEffect(() => {
    if (callData.role === 'receiver' && contactUri && localStream) {
      webRtcManager.addConnection(webSocket, account, contactUri, callData, localStream, screenShareLocalStream);
    }
  }, [account, callData, contactUri, localStream, screenShareLocalStream, webRtcManager, webSocket]);

  const getMediaDevices = useCallback(async (): Promise<MediaDevicesInfo> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      // TODO: On Firefox, some devices can sometime be duplicated (2 devices can share the same deviceId). Using a map
      //       and then converting it to an array makes it so that there is no duplicate. If we find a way to prevent
      //       Firefox from listing 2 devices with the same deviceId, we can remove this logic.
      const newMediaDevices: Record<MediaDeviceKind, Record<string, MediaDeviceInfo>> = {
        audioinput: {},
        audiooutput: {},
        videoinput: {},
      };

      for (const device of devices) {
        newMediaDevices[device.kind][device.deviceId] = device;
      }

      return {
        audioinput: Object.values(newMediaDevices.audioinput),
        audiooutput: Object.values(newMediaDevices.audiooutput),
        videoinput: Object.values(newMediaDevices.videoinput),
      };
    } catch (e) {
      throw new Error('Could not get media devices', { cause: e });
    }
  }, []);

  const updateLocalStream = useCallback(
    async (mediaDeviceIds?: MediaInputIds) => {
      const devices = await getMediaDevices();

      let audioConstraint: MediaTrackConstraints | boolean = devices.audioinput.length !== 0;
      let videoConstraint: MediaTrackConstraints | boolean = devices.videoinput.length !== 0;

      if (!audioConstraint && !videoConstraint) {
        return;
      }

      if (mediaDeviceIds?.audio !== undefined) {
        audioConstraint = mediaDeviceIds.audio !== false ? { deviceId: mediaDeviceIds.audio } : false;
      }
      if (mediaDeviceIds?.video !== undefined) {
        videoConstraint = mediaDeviceIds.video !== false ? { deviceId: mediaDeviceIds.video } : false;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraint,
          video: videoConstraint,
        });

        for (const track of stream.getTracks()) {
          track.enabled = false;
        }

        setLocalStream(stream);
      } catch (e) {
        throw new Error('Could not get media devices', { cause: e });
      }
    },
    [getMediaDevices]
  );

  const updateScreenShare = useCallback(
    async (isOn: boolean) => {
      if (isOn) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        setScreenShareLocalStream(stream);
        return stream;
      } else {
        if (screenShareLocalStream) {
          for (const track of screenShareLocalStream.getTracks()) {
            track.stop();
          }
        }

        setScreenShareLocalStream(undefined);
      }
    },
    [screenShareLocalStream]
  );

  // TODO: Transform the effect into a callback
  const updateLocalStreams = webRtcManager.updateLocalStreams;
  useEffect(() => {
    if ((!localStream && !screenShareLocalStream) || !updateLocalStreams) {
      return;
    }

    updateLocalStreams(localStream, screenShareLocalStream);
  }, [localStream, screenShareLocalStream, updateLocalStreams]);

  const sendWebRtcOffer = useCallback(async () => {
    if (contactUri) {
      webRtcManager.addConnection(webSocket, account, contactUri, callData, localStream, screenShareLocalStream);
    }
  }, [account, callData, contactUri, localStream, screenShareLocalStream, webRtcManager, webSocket]);

  const closeConnection = useCallback(() => {
    const stopStream = (stream: MediaStream) => {
      const localTracks = stream.getTracks();
      if (localTracks) {
        for (const track of localTracks) {
          track.stop();
        }
      }
    };

    if (localStream) {
      stopStream(localStream);
    }
    if (screenShareLocalStream) {
      stopStream(screenShareLocalStream);
    }

    webRtcManager.clean();
  }, [localStream, screenShareLocalStream, webRtcManager]);

  return useMemo(
    () => ({
      iceConnectionState,
      localStream,
      screenShareLocalStream,
      remoteStreams,
      getMediaDevices,
      updateLocalStream,
      updateScreenShare,
      sendWebRtcOffer,
      closeConnection,
    }),
    [
      iceConnectionState,
      localStream,
      screenShareLocalStream,
      remoteStreams,
      getMediaDevices,
      updateLocalStream,
      updateScreenShare,
      sendWebRtcOffer,
      closeConnection,
    ]
  );
};
