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
import { ConversationMemberEventCode } from '../enums/conversation-member-event-code.js'
import { DeviceAuthStateCode } from '../enums/device-auth-state.js'
import { MessageStatusCode } from '../enums/message-status-code.js'
import { AccountDetails, Devices } from './account.js'
import { Message, Reaction } from './conversation.js'

export interface IKnownDevicesChanged {
  devices: Devices
}

export interface IAccountDetails {
  details: AccountDetails
}

export interface ContactMessage {
  senderContactId: string
}

export interface ConversationMessage {
  conversationId: string
  message: Message
}

export interface ConversationMemberEvent {
  conversationId: string
  member: string
  event: ConversationMemberEventCode
}

export interface ConversationView {
  conversationId: string
}

export interface ConversationReady {
  conversationId: string
}

export interface AccountMessageStatus {
  conversationId: string
  peer: string
  messageId: string
  status: MessageStatusCode
}

export interface AddDeviceStateChanged {
  state: DeviceAuthStateCode
  details: Record<string, string>
  opId: number
}

export interface DeviceAuthStateChanged {
  accountId: string
  state: DeviceAuthStateCode
  details: Record<string, string>
}

export interface ReactionAdded {
  accountId: string
  conversationId: string
  messageId: string
  reaction: Reaction
}

export interface AddReaction {
  accountId: string
  conversationId: string
  messageId: string
  reaction: string
}

export interface ReactionRemoved {
  conversationId: string
  messageId: string
  reactionId: string
}

export interface ProfileReceived {
  peer: string
  displayName?: string
}

export interface LoadMoreMessages {
  accountId: string
  conversationId: string
  lastMessageId: string
  limit?: number
  messages?: Message[]
}

export interface LoadSwarmUntil {
  accountId: string
  conversationId: string
  fromMessageId: string
  toMessageId: string
  messages?: Message[]
  firstSection?: boolean
}

export interface ComposingStatus {
  contactId?: string // optional (ignored) when is about the user sending it
  conversationId: string
  isWriting: boolean
}

export interface WithSender {
  senderId: string
}

export interface WithReceiver {
  receiverId: string
}

export interface CallAction {
  conversationId: string
  // The sender's attempt at the call: a new one each time it calls or answers, so that a member who
  // leaves and joins again gets a new connection, and a late message of its earlier attempt is
  // told apart. Older clients leave it out.
  sessionId?: string
  // False from a peer that reads ICE candidates only in descriptions, such as the desktop and mobile
  // apps: a description to it waits for every candidate, and no candidate is sent on its own.
  trickleIce?: boolean
}

export interface CallInvite extends CallAction {
  withVideoOn: boolean
  // The call of a native app's device that hosts it (the desktop and mobile apps' group calls): each
  // member connects to that device alone, which sends it the mix of everyone, rather than to each
  // other member.
  hosted?: boolean
  // When the inviter's server sent it (ms since the epoch): an invite delivered late, because this
  // account was unreachable, rings for a call long over. Older senders leave it out.
  sentAt?: number
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CallJoin extends CallAction {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CallExit extends CallAction {}

export interface WebRtcSdp extends CallAction {
  sdp: RTCSessionDescriptionInit
}

export interface WebRtcIceCandidate extends CallAction {
  candidate: RTCIceCandidate
}

export interface NewBuddyNotification {
  accountId: string
  buddyUri: string
  status: number
  lineStatus: string
}
