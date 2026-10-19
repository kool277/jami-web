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
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'

import { IWebSocketContext } from '../contexts/WebSocketProvider.js'
import { Account } from '../models/account.js'
import { CallData } from '../services/CallManager.js'
import { Listener } from '../utils/utils.js'
import { RTCPeerConnectionHandler, RTCPeerConnectionInfos } from './RtcPeerConnectionHandler.js'

export const useWebRtcManager = () => {
  const [webRtcManager] = useState(() => new WebRtcManager())
  const subscribe = useCallback((listener: Listener) => webRtcManager.subscribe(listener), [webRtcManager])
  const getSnapshot = useCallback(() => webRtcManager.getSnapshot(), [webRtcManager])
  const connectionsInfos = useSyncExternalStore(subscribe, getSnapshot)

  return useMemo(
    () => ({
      addConnection: webRtcManager.addConnection.bind(webRtcManager),
      removeConnection: webRtcManager.removeConnection.bind(webRtcManager),
      removeLostConnections: webRtcManager.removeLostConnections.bind(webRtcManager),
      hasConnection: webRtcManager.hasConnection.bind(webRtcManager),
      hasSession: webRtcManager.hasSession.bind(webRtcManager),
      receiveDescription: webRtcManager.receiveDescription.bind(webRtcManager),
      receiveIceCandidate: webRtcManager.receiveIceCandidate.bind(webRtcManager),
      updateLocalStreams: webRtcManager.updateLocalStreams.bind(webRtcManager),
      clean: webRtcManager.clean.bind(webRtcManager),
      connectionsInfos: connectionsInfos,
    }),
    [connectionsInfos, webRtcManager],
  )
}

type Connection = {
  handler: RTCPeerConnectionHandler
  // The peer's attempt at the call this connection belongs to (see CallAction.sessionId).
  sessionId: string | undefined
}

const lostIceConnectionStates: readonly RTCIceConnectionState[] = ['disconnected', 'failed']

const pendingIceCandidatesKey = (contactUri: string, sessionId: string | undefined) =>
  `${contactUri} ${sessionId ?? ''}`

// A call connects this account to every other participant, so that a group call is a mesh.
export class WebRtcManager {
  private connections: Record<string, Connection> = {} // key is contactUri
  // The daemon can deliver an ICE candidate before the offer it goes with, so before there is a
  // connection to give it to.
  private pendingIceCandidates = new Map<string, RTCIceCandidate[]>()

  private listeners: Listener[] = []
  private snapshot: Record<string, RTCPeerConnectionInfos> = {} // key is contactUri

  addConnection(
    webSocket: IWebSocketContext,
    account: Account,
    contactUri: string,
    callData: CallData,
    localStream: MediaStream | undefined,
    screenShareLocalStream: MediaStream | undefined,
    sessionId: string | undefined,
  ) {
    const existingConnection = this.connections[contactUri]
    if (existingConnection && existingConnection.sessionId === sessionId) {
      console.debug('Attempted to establish an WebRTC connection with the same peer more than once')
      return
    }

    // The peer came back with a new session: the connection to its previous one is dead.
    existingConnection?.handler.disconnect()
    const handler = new RTCPeerConnectionHandler(
      webSocket,
      account,
      contactUri,
      callData,
      localStream,
      screenShareLocalStream,
      this.emitChange.bind(this),
    )
    this.connections[contactUri] = { handler, sessionId }

    const key = pendingIceCandidatesKey(contactUri, sessionId)
    const pendingIceCandidates = this.pendingIceCandidates.get(key) ?? []
    this.pendingIceCandidates.delete(key)
    pendingIceCandidates.forEach((candidate) => void handler.receiveIceCandidate(candidate))
    this.emitChange()
  }

  removeConnection(contactUri: string) {
    const connection = this.connections[contactUri]
    if (!connection) {
      return
    }

    delete this.connections[contactUri]
    connection.handler.disconnect()
  }

  // Returns the contactUri of the connections it removed.
  removeLostConnections() {
    const lostContactUris = Object.entries(this.connections)
      .filter(([, { handler }]) => lostIceConnectionStates.includes(handler.getInfos().iceConnectionState))
      .map(([contactUri]) => contactUri)
    lostContactUris.forEach((contactUri) => this.removeConnection(contactUri))
    return lostContactUris
  }

  hasConnection(contactUri: string) {
    return contactUri in this.connections
  }

  hasSession(contactUri: string, sessionId: string | undefined) {
    const connection = this.connections[contactUri]
    return connection !== undefined && connection.sessionId === sessionId
  }

  async receiveDescription(contactUri: string, sessionId: string | undefined, description: RTCSessionDescriptionInit) {
    if (!this.hasSession(contactUri, sessionId)) {
      console.warn('Ignoring a WebRTC description of a session with no connection', contactUri, sessionId)
      return
    }

    await this.connections[contactUri].handler.receiveDescription(description)
  }

  async receiveIceCandidate(contactUri: string, sessionId: string | undefined, candidate: RTCIceCandidate | undefined) {
    if (!candidate) {
      return
    }

    if (this.hasSession(contactUri, sessionId)) {
      await this.connections[contactUri].handler.receiveIceCandidate(candidate)
      return
    }

    const key = pendingIceCandidatesKey(contactUri, sessionId)
    this.pendingIceCandidates.set(key, [...(this.pendingIceCandidates.get(key) ?? []), candidate])
  }

  updateLocalStreams(localStream: MediaStream | undefined, screenShareLocalStream: MediaStream | undefined) {
    Object.values(this.connections).forEach(({ handler }) =>
      handler.updateLocalStreams(localStream, screenShareLocalStream),
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
    this.snapshot = Object.entries(this.connections).reduce(
      (acc, [contactUri, { handler }]) => {
        acc[contactUri] = handler.getInfos()
        return acc
      },
      {} as Record<string, RTCPeerConnectionInfos>,
    )

    this.listeners.forEach((listener) => listener())
  }

  clean() {
    Object.values(this.connections).forEach(({ handler }) => handler.disconnect())
    this.connections = {}
    this.pendingIceCandidates.clear()
    this.emitChange()
  }
}
