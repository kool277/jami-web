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
import { createRequire } from 'node:module'

import fs from 'fs/promises'
import {
  AccountDetails,
  AccountMessageStatus,
  ComposingStatus,
  ContactDetails,
  ConversationInfos,
  ConversationMemberEventCode,
  ConversationMessage,
  ConversationPreferences,
  Devices,
  LookupResult,
  Message,
  Reaction,
  RegisteredNameFoundState,
  VolatileDetails,
  WebSocketMessage,
  WebSocketMessageType,
} from 'jami-web-common'
import { DataTransferError } from 'jami-web-common/src/enums/datatransfer-error-code.js'
import log from 'loglevel'
import os from 'os'
import { filter, firstValueFrom, map, Subject } from 'rxjs'
import { Service } from 'typedi'

import { getAvatar } from '../utils/vCard.js'
import { WebSocketServer } from '../websocket/websocket-server.js'
import { ConversationMemberInfos } from './conversation-member-infos.js'
import { ConversationRequestMetadata } from './conversation-request-metadata.js'
import { JamiSignal } from './jami-signal.js'
import {
  AccountDetailsChanged,
  AccountMessageStatusChanged,
  AccountProfileReceived,
  ClearCache,
  ComposingStatusChanged,
  ContactAdded,
  ContactRemoved,
  ConversationLoaded,
  ConversationMemberEvent,
  ConversationReady,
  ConversationRemoved,
  ConversationRequestReceived,
  DataTransferEvent,
  IncomingAccountMessage,
  KnownDevicesChanged,
  NameRegistrationEnded,
  ProfileReceived,
  ReactionAdded,
  ReactionRemoved,
  RegisteredNameFound,
  RegistrationStateChanged,
  SwarmLoaded,
  SwarmMessageReceived,
  SwarmMessageUpdated,
  VolatileDetailsChanged,
} from './jami-signal-interfaces.js'
import { JamiSwig, StringMap, stringMapToRecord, stringVectToArray, vectMapToRecordArray } from './jami-swig.js'
import { MessageState, NameRegistrationEndedState, RegistrationState } from './state-enums.js'

const require = createRequire(import.meta.url)

@Service()
export class Jamid {
  private jamiSwig: JamiSwig
  private usernamesToAccountIds = new Map<string, string>()
  readonly events

  constructor(private webSocketServer: WebSocketServer) {
    this.jamiSwig = require('../../jamid.node') as JamiSwig

    // Setup signal handlers
    const handlers: Record<string, unknown> = {}

    // Add default handler for all signals
    const createDefaultHandler = (signal: string) => {
      return (...args: unknown[]) => log.warn('Unhandled', signal, args)
    }
    for (const signal in JamiSignal) {
      handlers[signal] = createDefaultHandler(signal)
    }

    // Overwrite handlers for handled signals using RxJS Subjects, converting multiple arguments to objects
    const onClearCache = new Subject<ClearCache>()
    handlers.ClearCache = (accountId: string, conversationId: string) =>
      onClearCache.next({ accountId, conversationId })

    const onAccountsChanged = new Subject<void>()
    handlers.AccountsChanged = () => onAccountsChanged.next()

    const onAccountDetailsChanged = new Subject<AccountDetailsChanged>()
    handlers.AccountDetailsChanged = (accountId: string, details: AccountDetails) =>
      onAccountDetailsChanged.next({ accountId, details })

    const onAccountProfileReceived = new Subject<AccountProfileReceived>()
    handlers.AccountProfileReceived = (accountId: string, displayName: string, photo: string) =>
      onAccountProfileReceived.next({ accountId, displayName, photo })

    const onVolatileDetailsChanged = new Subject<VolatileDetailsChanged>()
    handlers.VolatileDetailsChanged = (accountId: string, details: VolatileDetails) =>
      onVolatileDetailsChanged.next({ accountId, details })

    const onRegistrationStateChanged = new Subject<RegistrationStateChanged>()
    handlers.RegistrationStateChanged = (accountId: string, state: RegistrationState, code: number, details: string) =>
      onRegistrationStateChanged.next({ accountId, state, code, details })

    const onNameRegistrationEnded = new Subject<NameRegistrationEnded>()
    handlers.NameRegistrationEnded = (accountId: string, state: NameRegistrationEndedState, username: string) =>
      onNameRegistrationEnded.next({ accountId, state, username })

    const onRegisteredNameFound = new Subject<RegisteredNameFound>()
    handlers.RegisteredNameFound = (
      accountId: string,
      state: RegisteredNameFoundState,
      address: string,
      username: string,
    ) => onRegisteredNameFound.next({ accountId, state, address, username })

    const onKnownDevicesChanged = new Subject<KnownDevicesChanged>()
    handlers.KnownDevicesChanged = (accountId: string, devices: Devices) =>
      onKnownDevicesChanged.next({ accountId, devices })

    const onIncomingAccountMessage = new Subject<IncomingAccountMessage>()
    handlers.IncomingAccountMessage = (accountId: string, from: string, payload: Record<string, string>) =>
      onIncomingAccountMessage.next({ accountId, from, payload })

    const onAccountMessageStatusChanged = new Subject<AccountMessageStatusChanged>()
    handlers.AccountMessageStatusChanged = (
      accountId: string,
      messageId: string,
      peer: string,
      state: MessageState,
      conversationId: string,
    ) => onAccountMessageStatusChanged.next({ accountId, messageId, peer, state, conversationId })

    const onContactAdded = new Subject<ContactAdded>()
    handlers.ContactAdded = (accountId: string, contactId: string, confirmed: boolean) =>
      onContactAdded.next({ accountId, contactId, confirmed })

    const onContactRemoved = new Subject<ContactRemoved>()
    handlers.ContactRemoved = (accountId: string, contactId: string, banned: boolean) =>
      onContactRemoved.next({ accountId, contactId, banned })

    const onConversationRequestReceived = new Subject<ConversationRequestReceived>()
    handlers.ConversationRequestReceived = (
      accountId: string,
      conversationId: string,
      metadata: ConversationRequestMetadata,
    ) => onConversationRequestReceived.next({ accountId, conversationId, metadata })

    const onConversationReady = new Subject<ConversationReady>()
    handlers.ConversationReady = (accountId: string, conversationId: string) =>
      onConversationReady.next({ accountId, conversationId })

    const onConversationRemoved = new Subject<ConversationRemoved>()
    handlers.ConversationRemoved = (accountId: string, conversationId: string) =>
      onConversationRemoved.next({ accountId, conversationId })

    const onConversationLoaded = new Subject<ConversationLoaded>()
    handlers.ConversationLoaded = (id: number, accountId: string, conversationId: string, messages: Message[]) =>
      onConversationLoaded.next({ id, accountId, conversationId, messages })

    const onProfileReceived = new Subject<ProfileReceived>()
    handlers.ProfileReceived = (accountId: string, from: string, path: string) =>
      onProfileReceived.next({ accountId, from, path })

    const onSwarmLoaded = new Subject<SwarmLoaded>()
    handlers.SwarmLoaded = (id: number, accountId: string, conversationId: string, messages: Message[]) =>
      onSwarmLoaded.next({ id, accountId, conversationId, messages })

    const onConversationMemberEvent = new Subject<ConversationMemberEvent>()
    handlers.ConversationMemberEvent = (
      accountId: string,
      conversationId: string,
      memberUri: string,
      event: ConversationMemberEventCode,
    ) => {
      onConversationMemberEvent.next({ accountId, conversationId, memberUri, event })
    }

    const onDataTransferEvent = new Subject<DataTransferEvent>()
    handlers.DataTransferEvent = (
      accountId: string,
      conversationId: string,
      interactionId: string,
      fileId: string,
      eventCode: number,
    ) => onDataTransferEvent.next({ accountId, conversationId, interactionId, fileId, eventCode })

    const onSwarmMessageReceived = new Subject<SwarmMessageReceived>()
    handlers.SwarmMessageReceived = (accountId: string, conversationId: string, message: Message) =>
      onSwarmMessageReceived.next({ accountId, conversationId, message })

    const onSwarmMessageUpdated = new Subject<SwarmMessageUpdated>()
    handlers.SwarmMessageUpdated = (accountId: string, conversationId: string, message: Message) =>
      onSwarmMessageUpdated.next({ accountId, conversationId, message })

    const onReactionAdded = new Subject<ReactionAdded>()
    handlers.ReactionAdded = (accountId: string, conversationId: string, messageId: string, reaction: Reaction) =>
      onReactionAdded.next({ accountId, conversationId, messageId, reaction })

    const onReactionRemoved = new Subject<ReactionRemoved>()
    handlers.ReactionRemoved = (accountId: string, conversationId: string, messageId: string, reactionId: string) =>
      onReactionRemoved.next({ accountId, conversationId, messageId, reactionId })

    const onComposingStatusChanged = new Subject<ComposingStatusChanged>()
    handlers.ComposingStatusChanged = (accountId: string, conversationId: string, from: string, status: number) =>
      onComposingStatusChanged.next({ accountId, conversationId, from, status })

    // Expose all signals in an events object to allow other handlers to subscribe after jamiSwig.init()
    this.events = {
      onAccountsChanged: onAccountsChanged.asObservable(),
      onAccountDetailsChanged: onAccountDetailsChanged.asObservable(),
      onAccountProfileReceived: onAccountProfileReceived.asObservable(),
      onVolatileDetailsChanged: onVolatileDetailsChanged.asObservable(),
      onRegistrationStateChanged: onRegistrationStateChanged.asObservable(),
      onNameRegistrationEnded: onNameRegistrationEnded.asObservable(),
      onRegisteredNameFound: onRegisteredNameFound.asObservable(),
      onKnownDevicesChanged: onKnownDevicesChanged.asObservable(),
      onIncomingAccountMessage: onIncomingAccountMessage.asObservable(),
      onAccountMessageStatusChanged: onAccountMessageStatusChanged.asObservable(),
      onClearCache: onClearCache.asObservable(),
      onContactAdded: onContactAdded.asObservable(),
      onContactRemoved: onContactRemoved.asObservable(),
      onConversationRequestReceived: onConversationRequestReceived.asObservable(),
      onConversationReady: onConversationReady.asObservable(),
      onConversationRemoved: onConversationRemoved.asObservable(),
      onConversationLoaded: onConversationLoaded.asObservable(),
      onDataTransferEvent: onDataTransferEvent.asObservable(),
      onSwarmLoaded: onSwarmLoaded.asObservable(),
      onConversationMemberEvent: onConversationMemberEvent.asObservable(),
      onSwarmMessageReceived: onSwarmMessageReceived.asObservable(),
      onSwarmMessageUpdated: onSwarmMessageUpdated.asObservable(),
      onComposingStatusChanged: onComposingStatusChanged.asObservable(),
      onReactionAdded: onReactionAdded.asObservable(),
      onReactionRemoved: onReactionRemoved.asObservable(),
      onProfileReceived: onProfileReceived.asObservable(),
    }

    this.setupSignalHandlers()

    if (process.env.JAMI_WEB_MONITOR === 'true') {
      this.jamiSwig.monitor(true)
    }

    // RxJS Subjects are used as signal handlers for the following reasons:
    // 1. You cannot change event handlers after calling jamiSwig.init()
    // 2. You cannot specify multiple handlers for the same event
    // 3. You cannot specify a default handler
    this.jamiSwig.init(handlers)
  }

  stop(): void {
    this.jamiSwig.fini()
  }

  startConversation(accountId: string): string {
    return this.jamiSwig.startConversation(accountId)
  }

  getVolatileAccountDetails(accountId: string): VolatileDetails {
    return stringMapToRecord(this.jamiSwig.getVolatileAccountDetails(accountId)) as unknown as VolatileDetails
  }

  getAccountDetails(accountId: string): AccountDetails {
    return stringMapToRecord(this.jamiSwig.getAccountDetails(accountId)) as unknown as AccountDetails
  }

  setAccountDetails(accountId: string, accountDetails: AccountDetails): void {
    const accountDetailsStringMap: StringMap = new this.jamiSwig.StringMap()
    for (const [key, value] of Object.entries(accountDetails)) {
      accountDetailsStringMap.set(key, value)
    }
    this.jamiSwig.setAccountDetails(accountId, accountDetailsStringMap)
  }

  async addAccount(accountDetails: Partial<AccountDetails>): Promise<RegistrationStateChanged> {
    accountDetails['Account.type'] = 'RING'

    const accountDetailsStringMap: StringMap = new this.jamiSwig.StringMap()
    for (const [key, value] of Object.entries(accountDetails)) {
      accountDetailsStringMap.set(key, value.toString())
    }
    const accountId = this.jamiSwig.addAccount(accountDetailsStringMap)
    return firstValueFrom(
      this.events.onRegistrationStateChanged.pipe(
        filter((value) => value.accountId === accountId),
        filter(
          (value) => value.state === RegistrationState.Registered || value.state === RegistrationState.ErrorGeneric,
        ),
      ),
    )
  }

  removeAccount(accountId: string): void {
    this.jamiSwig.removeAccount(accountId)
  }

  getAccountIds(): string[] {
    return stringVectToArray(this.jamiSwig.getAccountList())
  }

  sendAccountTextMessage(accountId: string, contactId: string, message: string): void {
    const messageStringMap: StringMap = new this.jamiSwig.StringMap()
    messageStringMap.set('application/json', message)
    this.jamiSwig.sendAccountTextMessage(accountId, contactId, messageStringMap, 0)
  }

  async lookupUsername(username: string, nameserver: string, accountId?: string): Promise<LookupResult> {
    const hasRingNs = this.jamiSwig.lookupName(accountId || '', nameserver, username)
    if (!hasRingNs) {
      throw new Error('Jami does not have a nameserver')
    }
    return firstValueFrom(
      this.events.onRegisteredNameFound.pipe(
        filter((value) => value.username === username),
        map(({ accountId: _, ...response }) => response), // Remove accountId from response
      ),
    )
  }

  async lookupAddress(address: string, nameserver: string, accountId?: string): Promise<LookupResult> {
    if (address === undefined) {
      throw new Error('Address is undefined')
    }
    const hasRingNs = this.jamiSwig.lookupAddress(accountId || '', nameserver, address)

    if (!hasRingNs) {
      throw new Error('Jami does not have a nameserver')
    }
    return firstValueFrom(
      this.events.onRegisteredNameFound.pipe(
        filter((value) => value.address === address),
        map(({ accountId: _, ...response }) => response), // Remove accountId from response
      ),
    )
  }

  async registerUsername(accountId: string, username: string, password: string): Promise<NameRegistrationEndedState> {
    const hasRingNs = this.jamiSwig.registerName(accountId, username, 'password', password)
    if (!hasRingNs) {
      throw new Error('Jami does not have a nameserver')
    }
    return firstValueFrom(
      this.events.onNameRegistrationEnded.pipe(
        filter((value) => value.accountId === accountId),
        map((value) => value.state),
      ),
    )
  }

  clearCache(accountId: string, conversationId: string): void {
    this.jamiSwig.clearCache(accountId, conversationId)
  }

  getDevices(accountId: string): Devices {
    return stringMapToRecord(this.jamiSwig.getKnownRingDevices(accountId))
  }

  addContact(accountId: string, contactId: string): void {
    this.jamiSwig.addContact(accountId, contactId)
  }

  sendTrustRequest(accountId: string, contactId: string): void {
    this.jamiSwig.sendTrustRequest(accountId, contactId, new this.jamiSwig.Blob())
  }

  removeContact(accountId: string, contactId: string): void {
    this.jamiSwig.removeContact(accountId, contactId, false)
  }

  blockContact(accountId: string, contactId: string): void {
    this.jamiSwig.removeContact(accountId, contactId, true)
  }

  getContacts(accountId: string): ContactDetails[] {
    return vectMapToRecordArray(this.jamiSwig.getContacts(accountId)) as unknown as ContactDetails[]
  }

  getContactDetails(accountId: string, contactId: string): ContactDetails {
    return stringMapToRecord(this.jamiSwig.getContactDetails(accountId, contactId)) as unknown as ContactDetails
  }

  getDefaultModeratorUris(accountId: string): string[] {
    return stringVectToArray(this.jamiSwig.getDefaultModerators(accountId))
  }

  addDefaultModerator(accountId: string, contactId: string): void {
    this.jamiSwig.setDefaultModerator(accountId, contactId, true)
  }

  removeDefaultModerator(accountId: string, contactId: string): void {
    this.jamiSwig.setDefaultModerator(accountId, contactId, false)
  }

  getConversationIds(accountId: string): string[] {
    return stringVectToArray(this.jamiSwig.getConversations(accountId))
  }

  getConversationInfos(accountId: string, conversationId: string): ConversationInfos {
    return stringMapToRecord(this.jamiSwig.conversationInfos(accountId, conversationId)) as unknown as ConversationInfos
  }

  getConversationMembers(accountId: string, conversationId: string): ConversationMemberInfos[] {
    return vectMapToRecordArray(
      this.jamiSwig.getConversationMembers(accountId, conversationId),
    ) as unknown as ConversationMemberInfos[]
  }

  addConversationMember(accountId: string, conversationId: string, uri: string): void {
    this.jamiSwig.addConversationMember(accountId, conversationId, uri)
  }

  removeConversationMember(accountId: string, conversationId: string, uri: string): void {
    this.jamiSwig.removeConversationMember(accountId, conversationId, uri)
  }

  getConversationPreferences(accountId: string, conversationId: string): ConversationPreferences {
    return stringMapToRecord(
      this.jamiSwig.getConversationPreferences(accountId, conversationId),
    ) as unknown as ConversationPreferences
  }

  setConversationPreferences(accountId: string, conversationId: string, preferences: ConversationPreferences): void {
    const preferencesStringMap: StringMap = new this.jamiSwig.StringMap()
    for (const [key, value] of Object.entries(preferences)) {
      preferencesStringMap.set(key, value.toString())
    }
    this.jamiSwig.setConversationPreferences(accountId, conversationId, preferencesStringMap)
  }

  updateConversationInfos(accountId: string, conversationId: string, infos: ConversationInfos): void {
    const infosStringMap: StringMap = new this.jamiSwig.StringMap()
    for (const [key, value] of Object.entries(infos)) {
      infosStringMap.set(key, value.toString())
    }
    this.jamiSwig.updateConversationInfos(accountId, conversationId, infosStringMap)
  }

  async getConversationMessages(
    accountId: string,
    conversationId: string,
    fromMessage = '',
    n = 32,
  ): Promise<Message[]> {
    const requestId = this.jamiSwig.loadConversationMessages(accountId, conversationId, fromMessage, n)
    return firstValueFrom(
      this.events.onConversationLoaded.pipe(
        filter((value) => value.id === requestId),
        map((value) => value.messages),
      ),
    )
  }

  async getSwarmMessages(accountId: string, conversationId: string, fromMessage = '', n = 32): Promise<Message[]> {
    const requestId = this.jamiSwig.loadConversation(accountId, conversationId, fromMessage, n)
    return firstValueFrom(
      this.events.onSwarmLoaded.pipe(
        filter((value) => value.id === requestId),
        map((value) => value.messages),
      ),
    )
  }

  removeConversation(accountId: string, conversationId: string) {
    this.jamiSwig.removeConversation(accountId, conversationId)
  }

  getConversationRequests(accountId: string): ConversationRequestMetadata[] {
    return vectMapToRecordArray(
      this.jamiSwig.getConversationRequests(accountId),
    ) as unknown as ConversationRequestMetadata[]
  }

  acceptConversationRequest(accountId: string, conversationId: string): Promise<ConversationReady> {
    this.jamiSwig.acceptConversationRequest(accountId, conversationId)
    return firstValueFrom(
      this.events.onConversationReady.pipe(
        filter((value) => value.accountId === accountId),
        filter((value) => value.conversationId === conversationId),
      ),
    )
  }

  declineConversationRequest(accountId: string, conversationId: string): void {
    this.jamiSwig.declineConversationRequest(accountId, conversationId)
  }

  sendConversationMessage(
    accountId: string,
    conversationId: string,
    message: string,
    replyTo?: string,
    flag?: number,
  ): void {
    this.jamiSwig.sendMessage(accountId, conversationId, message, replyTo ?? '', flag ?? 0)
  }

  deleteConversationMessage(accountId: string, conversationId: string, messageId: string): void {
    this.jamiSwig.sendMessage(accountId, conversationId, '', messageId, 1)
  }

  setIsComposing(accountId: string, conversationId: string, isWriting: boolean) {
    this.jamiSwig.setIsComposing(accountId, conversationId, isWriting)
  }

  setMessageDisplayed(accountId: string, conversationId: string, messageId: string, status: number): boolean {
    return this.jamiSwig.setMessageDisplayed(accountId, conversationId, messageId, status)
  }

  getCallIds(accountId: string): string[] {
    return stringVectToArray(this.jamiSwig.getCallList(accountId))
  }

  // TODO: Replace Record with interface
  getCallDetails(accountId: string, callId: string): Record<string, string> {
    return stringMapToRecord(this.jamiSwig.getCallDetails(accountId, callId))
  }

  getAccountIdFromUsername(username: string): string | undefined {
    return this.usernamesToAccountIds.get(username.toLowerCase())
  }

  // File transfer
  sendFile(accountId: string, conversationId: string, path: string, displayName: string, replyTo: string): void {
    this.jamiSwig.sendFile(accountId, conversationId, path, displayName, replyTo)
  }

  downdloadFile(
    accountId: string,
    conversationId: string,
    interactionId: string,
    fileId: string,
    path: string,
  ): number {
    return this.jamiSwig.downloadFile(accountId, conversationId, interactionId, fileId, path)
  }

  cancelDataTransfer(accountId: string, conversationId: string, fileId: string): DataTransferError {
    return this.jamiSwig.cancelDataTransfer(accountId, conversationId, fileId)
  }

  getFileTransferInfo(
    accountId: string,
    conversationId: string,
    fileId: string,
    pathOut: string,
    totalOut: number,
    progressOut: number,
  ): DataTransferError {
    return this.jamiSwig.fileTransferInfo(accountId, conversationId, fileId, pathOut, totalOut, progressOut)
  }

  private setupSignalHandlers(): void {
    this.events.onDataTransferEvent.subscribe((signal) => {
      log.debug('Received DataTransferEvent:', JSON.stringify(signal))
    })

    this.events.onAccountsChanged.subscribe(() => {
      log.debug('Received AccountsChanged')
    })

    this.events.onAccountDetailsChanged.subscribe((signal) => {
      log.debug('Received AccountsDetailsChanged', JSON.stringify(signal))
    })

    this.events.onAccountProfileReceived.subscribe((signal) => {
      log.debug('\nReceived AccountProfileReceived\n', JSON.stringify(signal))
    })

    this.events.onVolatileDetailsChanged.subscribe(({ accountId, details }) => {
      const username = details['Account.registeredName']
      log.debug(
        `Received VolatileDetailsChanged: {"accountId":"${accountId}",` +
          `"details":{"Account.registeredName":"${username}", ...}}`,
      )

      if (username) {
        // Keep map of usernames to account IDs
        this.usernamesToAccountIds.set(username.toLowerCase(), accountId)
      }
    })

    this.events.onRegistrationStateChanged.subscribe((signal) => {
      log.debug('Received RegistrationStateChanged:', JSON.stringify(signal))
    })

    this.events.onNameRegistrationEnded.subscribe((signal) => {
      log.debug('Received NameRegistrationEnded:', JSON.stringify(signal))
    })

    this.events.onRegisteredNameFound.subscribe((signal) => {
      log.debug('Received RegisteredNameFound:', JSON.stringify(signal))
    })

    this.events.onKnownDevicesChanged.subscribe(({ accountId }) => {
      log.debug(`Received KnownDevicesChanged: {"accountId":"${accountId}", ...}`)
    })

    this.events.onIncomingAccountMessage.subscribe(<T extends WebSocketMessageType>(signal: IncomingAccountMessage) => {
      log.debug('Received IncomingAccountMessage:', JSON.stringify(signal))

      const message: Partial<WebSocketMessage<T>> = JSON.parse(signal.payload['application/json'])

      if (typeof message !== 'object' || message === null) {
        log.warn('Account message is not an object')
        return
      }

      if (message.type === undefined || message.data === undefined) {
        log.warn('Account message is not a valid WebSocketMessage (missing type or data fields)')
        return
      }

      if (!Object.values(WebSocketMessageType).includes(message.type)) {
        log.warn(`Invalid WebSocket message type: ${message.type}`)
        return
      }

      this.webSocketServer.send(signal.accountId, message.type, message.data)
    })

    this.events.onAccountMessageStatusChanged.subscribe((signal) => {
      log.debug('Received AccountMessageStatusChanged:', JSON.stringify(signal))
      const data: AccountMessageStatus = {
        conversationId: signal.conversationId,
        peer: signal.peer,
        messageId: signal.messageId,
        status: Number(signal.state),
      }
      this.webSocketServer.send(signal.accountId, WebSocketMessageType.AccountMessageStatus, data)
    })

    this.events.onContactAdded.subscribe((signal) => {
      log.debug('Received ContactAdded:', JSON.stringify(signal))
    })

    this.events.onContactRemoved.subscribe((signal) => {
      log.debug('Received ContactRemoved:', JSON.stringify(signal))
    })

    this.events.onConversationRequestReceived.subscribe((signal) => {
      log.debug('Received ConversationRequestReceived:', JSON.stringify(signal))
      //this.webSocketServer.send(signal.accountId, WebSocketMessageType.ConversationRequest, data);
    })

    this.events.onConversationReady.subscribe((signal) => {
      log.debug('Received ConversationReady:', JSON.stringify(signal))
    })

    this.events.onConversationRemoved.subscribe((signal) => {
      log.debug('Received ConversationRemoved:', JSON.stringify(signal))
    })

    this.events.onConversationLoaded.subscribe(({ id, accountId, conversationId }) => {
      log.debug(
        `Received ConversationLoaded: {"id":"${id}","accountId":"${accountId}",` +
          `"conversationId":"${conversationId}"}`,
      )
    })

    this.events.onSwarmLoaded.subscribe(({ id, accountId, conversationId }) => {
      log.debug(
        `Received SwarmLoaded: {"id":"${id}","accountId":"${accountId}",` + `"conversationId":"${conversationId}"}`,
      )
    })

    this.events.onConversationMemberEvent.subscribe((signal) => {
      log.debug('Received onConversationMemberEvent:', JSON.stringify(signal))
      const data = {
        conversationId: signal.conversationId,
        member: signal.memberUri,
        event: signal.event,
      }
      this.webSocketServer.send(signal.accountId, WebSocketMessageType.ConversationMemberEvent, data)
    })

    this.events.onSwarmMessageReceived.subscribe((signal) => {
      log.debug('Received SwarmMessageReceived:', JSON.stringify(signal))
      const data: ConversationMessage = {
        conversationId: signal.conversationId,
        message: {
          id: signal.message.id,
          author: signal.message.body.author,
          linearizedParent: signal.message.linearizedParent,
          parents: signal.message.body.parents,
          timestamp: signal.message.body.timestamp,
          displayName: signal.message.body.displayName,
          sha3sum: signal.message.body.sha3sum,
          tid: signal.message.body.tid,
          totalSize: signal.message.body.totalSize,
          fileId: signal.message.body.fileId,
          type: signal.message.body.type,
          'reply-to': signal.message.body['reply-to'],
          action: signal.message.body.action,
          editions: signal.message.editions,
          reactions: signal.message.reactions,
          status: signal.message.status,
          body: signal.message.body.body,
        },
      }
      this.webSocketServer.send(signal.accountId, WebSocketMessageType.ConversationMessage, data)
    })

    this.events.onSwarmMessageUpdated.subscribe((signal) => {
      log.debug('Received SwarmMessageUpdated:', JSON.stringify(signal))
      const data: ConversationMessage = {
        conversationId: signal.conversationId,
        message: {
          id: signal.message.id,
          author: signal.message.body.author,
          linearizedParent: signal.message.body.linearizedParent,
          parents: signal.message.body.parents,
          timestamp: signal.message.body.timestamp,
          type: signal.message.body.type,
          'reply-to': signal.message.body['reply-to'],
          action: signal.message.body.action,
          editions: signal.message.editions,
          reactions: signal.message.reactions,
          status: signal.message.status,
          body: signal.message.body.body,
        },
      }
      this.webSocketServer.send(signal.accountId, WebSocketMessageType.MessageEdition, data)
    })

    this.events.onReactionAdded.subscribe((signal) => {
      log.debug('Received Reaction Added ' + JSON.stringify(signal))
      const data: ReactionAdded = {
        accountId: signal.accountId,
        conversationId: signal.conversationId,
        messageId: signal.messageId,
        reaction: signal.reaction,
      }
      this.webSocketServer.send(signal.accountId, WebSocketMessageType.ReactionAdded, data)
    })

    this.events.onReactionRemoved.subscribe((signal) => {
      log.debug('Received Reaction Removed  ' + JSON.stringify(signal))
      const data: ReactionRemoved = {
        accountId: signal.accountId,
        conversationId: signal.conversationId,
        messageId: signal.messageId,
        reactionId: signal.reactionId,
      }
      this.webSocketServer.send(signal.accountId, WebSocketMessageType.ReactionRemoved, data)
    })

    this.events.onProfileReceived.subscribe(async (signal) => {
      log.debug('Received ProfileReceived:', JSON.stringify(signal))
      const peer = signal.from
      const accountId = signal.accountId
      const folder = os.homedir() + '/.local/share/jami/' + accountId + '/cache/profile/'
      const fileName = btoa(peer)
      const displayNameFile = fileName + '.txt'
      const profilePictureFile = fileName + '.png'
      try {
        await fs.unlink(folder + profilePictureFile)
      } catch (e) {
        log.debug('Profile picture does not exist')
      }
      try {
        await fs.unlink(folder + displayNameFile)
      } catch (e) {
        log.debug('Display name does not exist')
      }
      await getAvatar(accountId, peer)

      this.webSocketServer.send(accountId, WebSocketMessageType.ProfileReceived, { peer })
    })

    this.events.onComposingStatusChanged.subscribe((signal) => {
      log.debug('Received ComposingStatusChanged:', JSON.stringify(signal))
      const data: ComposingStatus = {
        contactId: signal.from,
        conversationId: signal.conversationId,
        isWriting: signal.status === 1,
      }

      this.webSocketServer.send(signal.accountId, WebSocketMessageType.ComposingStatus, data)
    })
  }
}
