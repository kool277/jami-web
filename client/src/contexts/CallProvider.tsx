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
import { useUserMediaContext } from './UserMediaProvider';
import { IWebSocketContext, useWebSocketContext } from './WebSocketProvider';

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

export interface ICallContext {
  remoteStreams: readonly MediaStream[];

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
  const webSocket = useWebSocketContext();
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
  const {
    localStream,
    updateLocalStream,
    screenShareLocalStream,
    updateScreenShare,
    setAudioInputDeviceId,
    setVideoDeviceId,
    stopMedias,
  } = useUserMediaContext();
  const { account } = useAuthContext();
  const webRtcManager = useWebRtcManager();

  // TODO: This logic will have to change to support multiple people in a call. Could we move this logic to the server?
  //       The client could make a single request with the conversationId, and the server would be tasked with sending
  //       all the individual requests to the members of the conversation.
  const contactUri = callMembers[0]?.contact.uri;
  const connectionInfos = webRtcManager.connectionsInfos[contactUri];
  const remoteStreams = connectionInfos?.remoteStreams;
  const iceConnectionState = connectionInfos?.iceConnectionState;

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
    stopMedias();
    webRtcManager.clean();
  }, [stopMedias, webRtcManager]);

  // Tracks logic should be moved into UserMediaProvider
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
  }, [isAudioOn, localStream, setAudioInputDeviceId]);

  // Tracks logic should be moved into UserMediaProvider
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
  }, [videoStatus, localStream, setVideoDeviceId]);

  // Track logic should be moved into UserMediaProvider
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

  return useMemo(
    () => ({
      remoteStreams,
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
      remoteStreams,
      isAudioOn,
      videoStatus,
      setIsAudioOn,
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
    ]
  );
};
