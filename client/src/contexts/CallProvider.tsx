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
import { CallAction, CallBegin, WebSocketMessageType } from 'jami-web-common';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createOptionalContext } from '../hooks/createOptionalContext';
import { ConversationMember } from '../models/conversation-member';
import { callTimeoutMs } from '../utils/constants';
import { AsyncSetState, SetState, WithChildren } from '../utils/utils';
import { useWebRtcManager } from '../webrtc/WebRtcManager';
import { useAuthContext } from './AuthProvider';
import { CallData, CallManagerContext } from './CallManagerProvider';
import ConditionalContextProvider from './ConditionalContextProvider';
import { IWebSocketContext, WebSocketContext } from './WebSocketProvider';

export type CallRole = 'caller' | 'receiver';

export enum CallStatus {
  Default,
  Loading,
  Ringing,
  Connecting,
  InCall,
  PermissionsDenied,
}

export enum VideoStatus {
  Off,
  Camera,
  ScreenShare,
}

type MediaDeviceIdState = {
  id: string | undefined;
  setId: (id: string | undefined) => void | Promise<void>;
};
type CurrentMediaDeviceIds = Record<MediaDeviceKind, MediaDeviceIdState>;

export type MediaDevicesInfo = Record<MediaDeviceKind, MediaDeviceInfo[]>;
export type MediaInputKind = 'audio' | 'video';
export type MediaInputIds = Record<MediaInputKind, string | false | undefined>;

export interface ICallContext {
  localStream: MediaStream | undefined;
  screenShareLocalStream: MediaStream | undefined;
  remoteStreams: readonly MediaStream[];

  mediaDevices: MediaDevicesInfo;
  currentMediaDeviceIds: CurrentMediaDeviceIds;

  isAudioOn: boolean;
  setIsAudioOn: SetState<boolean>;
  videoStatus: VideoStatus;
  updateVideoStatus: AsyncSetState<VideoStatus>;
  isChatShown: boolean;
  setIsChatShown: SetState<boolean>;
  isFullscreen: boolean;
  setIsFullscreen: SetState<boolean>;
  callRole: CallRole;
  callStatus: CallStatus;
  callStartTime: number | undefined;

  acceptCall: (withVideoOn: boolean) => void;
  endCall: () => void;
}

const optionalCallContext = createOptionalContext<ICallContext>('CallContext');
export const useCallContext = optionalCallContext.useOptionalContext;

export default ({ children }: WithChildren) => {
  const webSocket = useContext(WebSocketContext);
  const { callMembers, callData, exitCall } = useContext(CallManagerContext);

  const dependencies = useMemo(
    () => ({
      webSocket,
      callMembers,
      callData,
      exitCall,
      conversationId: callData?.conversationId,
    }),
    [webSocket, callMembers, callData, exitCall]
  );

  return (
    <ConditionalContextProvider
      Context={optionalCallContext.Context}
      initialValue={undefined}
      dependencies={dependencies}
      useProviderValue={CallProvider}
    >
      {children}
    </ConditionalContextProvider>
  );
};

const CallProvider = ({
  callMembers,
  callData,
  exitCall,
  conversationId,
  webSocket,
}: {
  webSocket: IWebSocketContext;
  callMembers: ConversationMember[];
  callData: CallData;
  exitCall: () => void;
  conversationId: string;
}): ICallContext => {
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [screenShareLocalStream, setScreenShareLocalStream] = useState<MediaStream>();
  const { account } = useAuthContext();
  const webRtcManager = useWebRtcManager();

  // TODO: This logic will have to change to support multiple people in a call. Could we move this logic to the server?
  //       The client could make a single request with the conversationId, and the server would be tasked with sending
  //       all the individual requests to the members of the conversation.
  const contactUri = callMembers[0]?.contact.uri;
  const connectionInfos = webRtcManager.connectionsInfos[contactUri];
  const remoteStreams = connectionInfos?.remoteStreams;
  const iceConnectionState = connectionInfos?.iceConnectionState;

  const [mediaDevices, setMediaDevices] = useState<MediaDevicesInfo>({
    audioinput: [],
    audiooutput: [],
    videoinput: [],
  });
  const [audioInputDeviceId, setAudioInputDeviceId] = useState<string>();
  const [audioOutputDeviceId, setAudioOutputDeviceId] = useState<string>();
  const [videoDeviceId, setVideoDeviceId] = useState<string>();

  const [isAudioOn, setIsAudioOn] = useState(false);
  const [videoStatus, setVideoStatus] = useState(VideoStatus.Off);
  const [isChatShown, setIsChatShown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callStatus, setCallStatus] = useState(CallStatus.Default);
  const [callRole] = useState(callData?.role);
  const [callStartTime, setCallStartTime] = useState<number | undefined>(undefined);

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

  useEffect(() => {
    if (callStatus !== CallStatus.InCall) {
      return;
    }

    const updateMediaDevices = async () => {
      try {
        const newMediaDevices = await getMediaDevices();

        if (newMediaDevices.audiooutput.length !== 0 && !audioOutputDeviceId) {
          setAudioOutputDeviceId(newMediaDevices.audiooutput[0].deviceId);
        }

        setMediaDevices(newMediaDevices);
      } catch (e) {
        console.error('Could not update media devices:', e);
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', updateMediaDevices);
    updateMediaDevices();

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', updateMediaDevices);
    };
  }, [callStatus, getMediaDevices, audioOutputDeviceId]);

  useEffect(() => {
    if (localStream) {
      for (const track of localStream.getAudioTracks()) {
        track.enabled = isAudioOn;
        const deviceId = track.getSettings().deviceId;
        if (deviceId) {
          setAudioInputDeviceId(deviceId);
        }
      }
    }
  }, [isAudioOn, localStream]);

  useEffect(() => {
    if (localStream) {
      for (const track of localStream.getVideoTracks()) {
        track.enabled = videoStatus === VideoStatus.Camera;
        const deviceId = track.getSettings().deviceId;
        if (deviceId) {
          setVideoDeviceId(deviceId);
        }
      }
    }
  }, [videoStatus, localStream]);

  const updateVideoStatus = useCallback(
    async (newStatus: ((prevState: VideoStatus) => VideoStatus) | VideoStatus) => {
      if (typeof newStatus === 'function') {
        newStatus = newStatus(videoStatus);
      }

      const stream = await updateScreenShare(newStatus === VideoStatus.ScreenShare);
      if (stream) {
        for (const track of stream.getTracks()) {
          track.addEventListener('ended', () => {
            console.warn('Browser ended screen sharing');
            updateVideoStatus(VideoStatus.Off);
          });
        }
      }

      setVideoStatus(newStatus);
    },
    [videoStatus, updateScreenShare]
  );

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (callRole === 'caller' && callStatus === CallStatus.Default) {
      const withVideoOn = callData?.withVideoOn ?? false;
      setCallStatus(CallStatus.Loading);
      updateLocalStream()
        .then(() => {
          const callBegin: CallBegin = {
            contactId: contactUri,
            conversationId,
            withVideoOn,
          };

          setCallStatus(CallStatus.Ringing);
          setVideoStatus(withVideoOn ? VideoStatus.Camera : VideoStatus.Off);
          console.info('Sending CallBegin', callBegin);
          webSocket.send(WebSocketMessageType.CallBegin, callBegin);
        })
        .catch((e) => {
          console.error(e);
          setCallStatus(CallStatus.PermissionsDenied);
        });
    }
  }, [webSocket, updateLocalStream, callRole, callStatus, contactUri, conversationId, callData]);

  const acceptCall = useCallback(
    (withVideoOn: boolean) => {
      setCallStatus(CallStatus.Loading);
      updateLocalStream()
        .then(() => {
          const callAccept: CallAction = {
            contactId: contactUri,
            conversationId,
          };

          setVideoStatus(withVideoOn ? VideoStatus.Camera : VideoStatus.Off);
          setCallStatus(CallStatus.Connecting);
          console.info('Sending CallAccept', callAccept);
          webSocket.send(WebSocketMessageType.CallAccept, callAccept);
        })
        .catch((e) => {
          console.error(e);
          setCallStatus(CallStatus.PermissionsDenied);
        });
    },
    [webSocket, updateLocalStream, contactUri, conversationId]
  );

  useEffect(() => {
    if (callRole === 'caller' && callStatus === CallStatus.Ringing) {
      const callAcceptListener = (data: CallAction) => {
        console.info('Received event on CallAccept', data);
        if (data.conversationId !== conversationId) {
          console.warn('Wrong incoming conversationId, ignoring action');
          return;
        }

        setCallStatus(CallStatus.Connecting);

        sendWebRtcOffer();
      };

      webSocket.bind(WebSocketMessageType.CallAccept, callAcceptListener);

      return () => {
        webSocket.unbind(WebSocketMessageType.CallAccept, callAcceptListener);
      };
    }
  }, [callRole, webSocket, sendWebRtcOffer, callStatus, conversationId]);

  const endCall = useCallback(() => {
    const callEnd: CallAction = {
      contactId: contactUri,
      conversationId,
    };

    console.info('Sending CallEnd', callEnd);
    closeConnection();
    webSocket.send(WebSocketMessageType.CallEnd, callEnd);
    exitCall();
    // TODO: write in chat that the call ended
  }, [webSocket, contactUri, conversationId, closeConnection, exitCall]);

  useEffect(() => {
    const callEndListener = (data: CallAction) => {
      console.info('Received event on CallEnd', data);
      if (data.conversationId !== conversationId) {
        console.warn('Wrong incoming conversationId, ignoring action');
        return;
      }

      closeConnection();
      exitCall();
      // TODO: write in chat that the call ended
    };

    webSocket.bind(WebSocketMessageType.CallEnd, callEndListener);
    return () => {
      webSocket.unbind(WebSocketMessageType.CallEnd, callEndListener);
    };
  }, [webSocket, exitCall, conversationId, closeConnection]);

  useEffect(() => {
    if (
      callStatus === CallStatus.Connecting &&
      (iceConnectionState === 'connected' || iceConnectionState === 'completed')
    ) {
      console.info('Changing call status to InCall');
      setCallStatus(CallStatus.InCall);
      setCallStartTime(Date.now());
    }
  }, [iceConnectionState, callStatus]);

  useEffect(() => {
    if (iceConnectionState === 'disconnected' || iceConnectionState === 'failed') {
      console.info('ICE connection disconnected or failed, ending call');
      endCall();
    }
  }, [iceConnectionState, callStatus, videoStatus, endCall]);

  useEffect(() => {
    const checkStatusTimeout = () => {
      if (callStatus !== CallStatus.InCall) {
        endCall();
      }
    };
    const timeoutId = setTimeout(checkStatusTimeout, callTimeoutMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [callStatus, endCall]);

  const currentMediaDeviceIds: CurrentMediaDeviceIds = useMemo(() => {
    const createSetIdForDeviceKind = (mediaInputKind: MediaInputKind) => async (id: string | undefined) => {
      const mediaDeviceIds = {
        audio: audioInputDeviceId,
        video: videoDeviceId,
      };

      mediaDeviceIds[mediaInputKind] = id;

      await updateLocalStream(mediaDeviceIds);
    };

    return {
      audioinput: {
        id: audioInputDeviceId,
        setId: createSetIdForDeviceKind('audio'),
      },
      audiooutput: {
        id: audioOutputDeviceId,
        setId: setAudioOutputDeviceId,
      },
      videoinput: {
        id: videoDeviceId,
        setId: createSetIdForDeviceKind('video'),
      },
    };
  }, [updateLocalStream, audioInputDeviceId, audioOutputDeviceId, videoDeviceId]);

  return useMemo(
    () => ({
      localStream,
      screenShareLocalStream,
      remoteStreams,
      mediaDevices,
      currentMediaDeviceIds,
      isAudioOn,
      setIsAudioOn,
      videoStatus,
      updateVideoStatus,
      isChatShown,
      setIsChatShown,
      isFullscreen,
      setIsFullscreen,
      callRole,
      callStatus,
      callStartTime,
      acceptCall,
      endCall,
    }),
    [
      localStream,
      screenShareLocalStream,
      remoteStreams,
      mediaDevices,
      currentMediaDeviceIds,
      isAudioOn,
      videoStatus,
      updateVideoStatus,
      isChatShown,
      isFullscreen,
      callRole,
      callStatus,
      callStartTime,
      acceptCall,
      endCall,
    ]
  );
};
