/*
 * Copyright (C) 2022-2024 Savoir-faire Linux Inc.
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
import { useMemo, useRef, useSyncExternalStore } from 'react'

import { IWebSocketContext } from '../contexts/WebSocketProvider'
import { Account } from '../models/account'
import { CallData } from '../services/CallManager'
import { Listener } from '../utils/utils'
import { RTCPeerConnectionHandler, RTCPeerConnectionInfos } from './RtcPeerConnectionHandler'

export const useWebRtcManager = () => {
  const webRtcManagerRef = useRef(new WebRtcManager())
  const connectionsInfos = useSyncExternalStore(
    webRtcManagerRef.current.subscribe.bind(webRtcManagerRef.current),
    webRtcManagerRef.current.getSnapshot.bind(webRtcManagerRef.current)
  )

  return useMemo(
    () => ({
      addConnection: webRtcManagerRef.current.addConnection.bind(webRtcManagerRef.current),
      removeConnection: webRtcManagerRef.current.removeConnection.bind(webRtcManagerRef.current),
      updateLocalStreams: webRtcManagerRef.current.updateLocalStreams.bind(webRtcManagerRef.current),
      clean: webRtcManagerRef.current.clean.bind(webRtcManagerRef.current),
      connectionsInfos: connectionsInfos,
    }),
    [connectionsInfos]
  )
}

class WebRtcManager {
  private connections: Record<string, RTCPeerConnectionHandler> = {} // key is contactUri

  private listeners: Listener[] = []
  private snapshot: Record<string, RTCPeerConnectionInfos> = {} // key is contactUri

  addConnection(
    webSocket: IWebSocketContext,
    account: Account,
    contactUri: string,
    callData: CallData,
    localStream: MediaStream | undefined,
    screenShareLocalStream: MediaStream | undefined
  ) {
    if (this.connections[contactUri]) {
      console.debug('Attempted to establish an WebRTC connection with the same peer more than once')
      return
    }

    const connection = new RTCPeerConnectionHandler(
      webSocket,
      account,
      contactUri,
      callData,
      localStream,
      screenShareLocalStream,
      this.emitChange.bind(this)
    )
    this.connections[contactUri] = connection
  }

  removeConnection(contactUri: string) {
    const connection = this.connections[contactUri]
    connection.disconnect()
    delete this.connections[contactUri]
  }

  updateLocalStreams(localStream: MediaStream | undefined, screenShareLocalStream: MediaStream | undefined) {
    Object.values(this.connections).forEach((connection) =>
      connection.updateLocalStreams(localStream, screenShareLocalStream)
    )
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners.filter((otherListener) => otherListener !== listener)
    }
  }

  getSnapshot(): Record<string, RTCPeerConnectionInfos> {
    return this.snapshot
  }

  emitChange() {
    this.snapshot = Object.entries(this.connections).reduce((acc, [contactUri, connection]) => {
      acc[contactUri] = connection.getInfos()
      return acc
    }, {} as Record<string, RTCPeerConnectionInfos>)

    this.listeners.forEach((listener) => listener())
  }

  clean() {
    Object.values(this.connections).forEach((connection) => connection.disconnect())
    this.connections = {}
    this.emitChange()
  }
}
