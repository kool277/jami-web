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
import { ConversationInfos, WebSocketMessageTable, WebSocketMessageType } from '@savoirfairelinux/jami-web-common'
import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider.js'
import { useAuthContext } from '../contexts/AuthProvider.js'
import { useUserMediaContext } from '../contexts/UserMediaProvider.js'
import { useWebSocketContext } from '../contexts/WebSocketProvider.js'
import { ConversationMember } from '../models/conversation-member.js'
import { useConversationInfosQuery, useMembersQuery } from '../services/conversationQueries.js'
import { callPeers } from '../utils/callPeers.js'
import { callTimeoutMs } from '../utils/constants.js'
import { AsyncSetState, SetState } from '../utils/utils.js'
import { useWebRtcManager } from '../webrtc/WebRtcManager.js'

export type CallRole = 'caller' | 'receiver' | undefined

export type CallData = {
  conversationId: string
  role: CallRole
  withVideoOn?: boolean
  // This account's attempt at the call, sent with each of its call messages (see CallAction.sessionId).
  sessionId: string
  // The member whose invitation a receiver is answering.
  callerUri?: string
}

export type CallParticipant = {
  uri: string
  stream: MediaStream
}

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

export interface ICallManager {
  callData: CallData | undefined
  callConversationInfos: ConversationInfos | undefined
  callMembers: ConversationMember[] | undefined

  // The other participants whose media arrived, in the order they connected.
  remoteParticipants: readonly CallParticipant[]

  isAudioOn: boolean
  setIsAudioOn: SetState<boolean>
  videoStatus: VideoStatus
  updateVideoStatus: AsyncSetState<VideoStatus>
  isChatShown: boolean
  setIsChatShown: SetState<boolean>
  isFullscreen: boolean
  setIsFullscreen: SetState<boolean>
  callStatus: CallStatus
  callStartTime: number | undefined

  startCall: (conversationId: string, withVideoOn?: boolean) => void
  acceptCall: (withVideoOn: boolean) => void
  endCall: () => void
}

const newCallSessionId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), (byte) => byte.toString(16).padStart(2, '0')).join('')

// Once this account has called or answered, the other members know it takes part in the call. A
// call is a mesh: whoever takes part connects to every member who joins after it.
const isParticipating = (callStatus: CallStatus) =>
  callStatus === CallStatus.Ringing || callStatus === CallStatus.Connecting || callStatus === CallStatus.InCall

export const useCallManager = () => {
  const { setAlertContent } = use(AlertSnackbarContext)
  const [callData, setCallData] = useState<CallData>()
  const webSocket = useWebSocketContext()
  const navigate = useNavigate()
  const { data: callConversationInfos } = useConversationInfosQuery(callData?.conversationId)
  const { data: callMembers } = useMembersQuery(callData?.conversationId)

  const {
    localStream,
    updateLocalStream,
    screenShareLocalStream,
    updateScreenShare,
    setAudioInputDeviceId,
    setVideoDeviceId,
    stopMedias,
  } = useUserMediaContext()
  const { account } = useAuthContext()
  const webRtcManager = useWebRtcManager()

  const [isAudioOn, setIsAudioOn] = useState(false)
  const [videoStatus, setVideoStatus] = useState(VideoStatus.Off)
  const [isChatShown, setIsChatShown] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [callStatus, setCallStatus] = useState(CallStatus.Default)
  const [callStartTime, setCallStartTime] = useState<number | undefined>(undefined)

  // The other members known to take part in the call: whoever invited this account, joined or
  // connected to it. The call ends for this account once the last of them has left.
  const participants = useRef(new Set<string>())
  // The members who declined or left. A call ends while it still rings once every member has.
  const leftMembers = useRef(new Set<string>())

  const conversationId = callData?.conversationId
  // The daemon lists a conversation's creator first, so the first member is often this account.
  const peers = useMemo(() => callPeers(callMembers, account.getUri()), [callMembers, account])

  const connectionsInfos = webRtcManager.connectionsInfos
  const remoteParticipants = useMemo(
    () =>
      Object.entries(connectionsInfos).flatMap(([uri, { remoteStreams }]) =>
        remoteStreams.length > 0 ? [{ uri, stream: remoteStreams[0] }] : [],
      ),
    [connectionsInfos],
  )
  const isConnected = Object.values(connectionsInfos).some(
    ({ iceConnectionState }) => iceConnectionState === 'connected' || iceConnectionState === 'completed',
  )
  const hasLostConnection = Object.values(connectionsInfos).some(
    ({ iceConnectionState }) => iceConnectionState === 'disconnected' || iceConnectionState === 'failed',
  )

  // TODO: Transform the effect into a callback
  const updateLocalStreams = webRtcManager.updateLocalStreams
  useEffect(() => {
    if ((!localStream && !screenShareLocalStream) || !updateLocalStreams) {
      return
    }

    updateLocalStreams(localStream, screenShareLocalStream)
  }, [localStream, screenShareLocalStream, updateLocalStreams])

  const closeConnection = useCallback(() => {
    stopMedias()
    webRtcManager.clean()
  }, [stopMedias, webRtcManager])

  // Tracks logic should be moved into UserMediaProvider
  useEffect(() => {
    if (localStream) {
      for (const track of localStream.getAudioTracks()) {
        track.enabled = isAudioOn
        const deviceId = track.getSettings().deviceId
        if (deviceId) {
          setAudioInputDeviceId(deviceId)
        }
      }
    }
  }, [isAudioOn, localStream, setAudioInputDeviceId])

  // Tracks logic should be moved into UserMediaProvider
  useEffect(() => {
    if (localStream) {
      for (const track of localStream.getVideoTracks()) {
        track.enabled = videoStatus === VideoStatus.Camera
        const deviceId = track.getSettings().deviceId
        if (deviceId) {
          setVideoDeviceId(deviceId)
        }
      }
    }
  }, [videoStatus, localStream, setVideoDeviceId])

  // Track logic should be moved into UserMediaProvider
  const updateVideoStatus = useCallback(
    async (newStatus: ((prevState: VideoStatus) => VideoStatus) | VideoStatus) => {
      if (typeof newStatus === 'function') {
        newStatus = newStatus(videoStatus)
      }

      const stream = await updateScreenShare(newStatus === VideoStatus.ScreenShare)
      if (stream) {
        for (const track of stream.getTracks()) {
          track.addEventListener('ended', () => {
            console.warn('Browser ended screen sharing')
            setVideoStatus(VideoStatus.Off)
          })
        }
      }

      setVideoStatus(newStatus)
    },
    [videoStatus, updateScreenShare],
  )

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null)
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
    }
  }, [])

  const connect = useCallback(
    (contactUri: string, sessionId: string | undefined) => {
      if (!callData) {
        return
      }

      participants.current.add(contactUri)
      leftMembers.current.delete(contactUri)
      webRtcManager.addConnection(
        webSocket,
        account,
        contactUri,
        callData,
        localStream,
        screenShareLocalStream,
        sessionId,
      )
    },
    [account, callData, localStream, screenShareLocalStream, webRtcManager, webSocket],
  )

  const endCall = useCallback(() => {
    if (!callData) {
      return
    }

    const callExit: WebSocketMessageTable['sendCallExit'] = {
      conversationId: callData.conversationId,
      sessionId: callData.sessionId,
    }

    console.info('Sending CallExit', callExit)
    closeConnection()
    webSocket.send(WebSocketMessageType.sendCallExit, callExit)
    setCallData(undefined)
    setCallStatus(CallStatus.Default)
    participants.current = new Set()
    leftMembers.current = new Set()
    // TODO: write in chat that the call ended
  }, [webSocket, callData, closeConnection])

  useEffect(() => {
    const callInviteListener = ({
      conversationId,
      withVideoOn,
      senderId,
      sessionId,
    }: WebSocketMessageTable['onCallInvite']) => {
      if (callData?.conversationId === conversationId) {
        // Another member started a call in the conversation of this one, not knowing about it: it is
        // the same call.
        if (isParticipating(callStatus)) {
          if (callStatus === CallStatus.Ringing) {
            setCallStatus(CallStatus.Connecting)
          }
          connect(senderId, sessionId)
        } else {
          participants.current.add(senderId)
        }
        return
      }

      if (callData) {
        // TODO: Currently, we display a notification if already in a call.
        //       In the future, we should handle receiving a call while already in another.
        setAlertContent({
          messageI18nKey: 'missed_incoming_call',
          messageI18nContext: { conversationId },
          severity: 'info',
          alertOpen: true,
        })
        return
      }

      participants.current = new Set([senderId])
      leftMembers.current = new Set()
      setCallData({ conversationId, role: 'receiver', withVideoOn, sessionId: newCallSessionId(), callerUri: senderId })
      navigate(`/conversation/${conversationId}`)
    }

    webSocket.bind(WebSocketMessageType.onCallInvite, callInviteListener)

    return () => {
      webSocket.unbind(WebSocketMessageType.onCallInvite, callInviteListener)
    }
  }, [webSocket, navigate, callData, callStatus, connect, setAlertContent])

  const startCall = useCallback(
    (conversationId: string, withVideoOn = false) => {
      if (callStatus !== CallStatus.Default) {
        return
      }

      const sessionId = newCallSessionId()
      participants.current = new Set()
      leftMembers.current = new Set()
      setCallData({ conversationId, withVideoOn, role: 'caller', sessionId })
      setCallStatus(CallStatus.Loading)
      updateLocalStream()
        .then(() => {
          const callInvite: WebSocketMessageTable['sendCallInvite'] = {
            conversationId: conversationId,
            withVideoOn,
            sessionId,
          }

          setCallStatus(CallStatus.Ringing)
          setVideoStatus(withVideoOn ? VideoStatus.Camera : VideoStatus.Off)
          webSocket.send(WebSocketMessageType.sendCallInvite, callInvite)
        })
        .catch((e) => {
          console.error(e)
          setCallStatus(CallStatus.PermissionsDenied)
        })
    },
    [webSocket, updateLocalStream, callStatus],
  )

  const acceptCall = useCallback(
    (withVideoOn: boolean) => {
      if (!callData) {
        console.warn('acceptCall without callData')
        return
      }
      setCallStatus(CallStatus.Loading)
      updateLocalStream()
        .then(() => {
          const callAccept: WebSocketMessageTable['sendCallJoin'] = {
            conversationId: callData.conversationId,
            sessionId: callData.sessionId,
          }

          setVideoStatus(withVideoOn ? VideoStatus.Camera : VideoStatus.Off)
          setCallStatus(CallStatus.Connecting)
          // The members in the call connect to this account when they hear it joined: it does not
          // know who they are, and the members who are not in the call would not answer.
          console.info('Sending CallJoin', callAccept)
          webSocket.send(WebSocketMessageType.sendCallJoin, callAccept)
        })
        .catch((e) => {
          console.error(e)
          setCallStatus(CallStatus.PermissionsDenied)
        })
    },
    [callData, updateLocalStream, webSocket],
  )

  useEffect(() => {
    if (!callData) {
      return
    }

    const callJoinListener = (data: WebSocketMessageTable['onCallJoin']) => {
      console.info('Received event on CallJoin', data, callData)
      if (data.conversationId !== callData.conversationId) {
        console.warn('Wrong incoming conversationId, ignoring action')
        return
      }

      if (!isParticipating(callStatus)) {
        // This account has not answered yet: the member who joined connects to it once it does.
        participants.current.add(data.senderId)
        return
      }

      if (callStatus === CallStatus.Ringing) {
        setCallStatus(CallStatus.Connecting)
      }
      connect(data.senderId, data.sessionId)
    }

    webSocket.bind(WebSocketMessageType.onCallJoin, callJoinListener)

    return () => {
      webSocket.unbind(WebSocketMessageType.onCallJoin, callJoinListener)
    }
  }, [callData, callStatus, connect, webSocket])

  useEffect(() => {
    const callExitListener = (data: WebSocketMessageTable['onCallExit']) => {
      console.info('Received event on CallExit', data)
      if (data.conversationId !== conversationId) {
        console.warn('Wrong incoming conversationId, ignoring action')
        return
      }

      const { senderId, sessionId } = data
      if (webRtcManager.hasConnection(senderId) && !webRtcManager.hasSession(senderId, sessionId)) {
        // The exit of an earlier session of a member who came back since.
        return
      }

      webRtcManager.removeConnection(senderId)
      participants.current.delete(senderId)
      leftMembers.current.add(senderId)

      const isOver =
        callStatus === CallStatus.Ringing
          ? peers.length > 0 && peers.every(({ contact }) => leftMembers.current.has(contact.uri))
          : participants.current.size === 0
      if (isOver) {
        endCall()
      }
      // TODO: write in chat that the call ended
    }

    webSocket.bind(WebSocketMessageType.onCallExit, callExitListener)
    return () => {
      webSocket.unbind(WebSocketMessageType.onCallExit, callExitListener)
    }
  }, [webSocket, endCall, conversationId, callStatus, peers, webRtcManager])

  useEffect(() => {
    if (!callData || !isParticipating(callStatus)) {
      return
    }

    const webRtcDescriptionListener = (data: WebSocketMessageTable['onWebRtcDescription']) => {
      if (data.conversationId !== callData.conversationId) {
        console.warn('Wrong incoming conversationId, ignoring action')
        return
      }

      if (!webRtcManager.hasSession(data.senderId, data.sessionId)) {
        if (data.sdp.type !== 'offer') {
          // The answer to a connection this account has replaced or closed since.
          return
        }
        // A member in the call connects to this account, which just joined, or came back itself.
        if (callStatus === CallStatus.Ringing) {
          setCallStatus(CallStatus.Connecting)
        }
        connect(data.senderId, data.sessionId)
      }
      void webRtcManager.receiveDescription(data.senderId, data.sessionId, data.sdp)
    }

    const webRtcIceCandidateListener = (data: WebSocketMessageTable['onWebRtcIceCandidate']) => {
      if (data.conversationId !== callData.conversationId) {
        console.warn('Wrong incoming conversationId, ignoring action')
        return
      }

      void webRtcManager.receiveIceCandidate(data.senderId, data.sessionId, data.candidate)
    }

    webSocket.bind(WebSocketMessageType.onWebRtcDescription, webRtcDescriptionListener)
    webSocket.bind(WebSocketMessageType.onWebRtcIceCandidate, webRtcIceCandidateListener)

    return () => {
      webSocket.unbind(WebSocketMessageType.onWebRtcDescription, webRtcDescriptionListener)
      webSocket.unbind(WebSocketMessageType.onWebRtcIceCandidate, webRtcIceCandidateListener)
    }
  }, [callData, callStatus, connect, webRtcManager, webSocket])

  useEffect(() => {
    if (callStatus === CallStatus.Connecting && isConnected) {
      console.info('Changing call status to InCall')
      void Promise.resolve().then(() => {
        setCallStatus(CallStatus.InCall)
        setCallStartTime(Date.now())
      })
    }
  }, [isConnected, callStatus])

  useEffect(() => {
    if (!hasLostConnection) {
      return
    }

    void Promise.resolve().then(() => {
      const lostContactUris = webRtcManager.removeLostConnections()
      if (lostContactUris.length === 0) {
        return
      }

      console.info('ICE connection disconnected or failed, leaving out', lostContactUris)
      lostContactUris.forEach((contactUri) => participants.current.delete(contactUri))
      if (participants.current.size === 0) {
        endCall()
      }
    })
  }, [hasLostConnection, webRtcManager, endCall])

  useEffect(() => {
    const checkStatusTimeout = () => {
      if (callStatus !== CallStatus.InCall) {
        endCall()
      }
    }
    const timeoutId = setTimeout(checkStatusTimeout, callTimeoutMs)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [callStatus, endCall])

  return useMemo(
    () => ({
      callData,
      callConversationInfos,
      callMembers,
      remoteParticipants,
      isAudioOn,
      setIsAudioOn,
      videoStatus,
      updateVideoStatus,
      isChatShown,
      setIsChatShown,
      isFullscreen,
      setIsFullscreen,
      callStatus,
      callStartTime,
      startCall,
      acceptCall,
      endCall,
    }),
    [
      callData,
      callConversationInfos,
      callMembers,
      remoteParticipants,
      isAudioOn,
      videoStatus,
      setIsAudioOn,
      updateVideoStatus,
      isChatShown,
      setIsChatShown,
      isFullscreen,
      setIsFullscreen,
      callStatus,
      callStartTime,
      startCall,
      acceptCall,
      endCall,
    ],
  )
}
