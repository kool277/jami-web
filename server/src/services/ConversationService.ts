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

import { IConversationRequest, IConversationSummary, Message, WebSocketMessageType } from 'jami-web-common'
import { Container, Service } from 'typedi'

import { ConversationRequestMetadata } from '../jamid/conversation-request-metadata.js'
import { Jamid } from '../jamid/jamid.js'
import { WebSocketServer } from '../websocket/websocket-server.js'
import { ContactService } from './ContactService.js'
import { PresenceService } from './PresenceService.js'

const jamid = Container.get(Jamid)
const presenceService = Container.get(PresenceService)
const webSocketServer = Container.get(WebSocketServer)
const contactService = Container.get(ContactService)

@Service()
export class ConversationService {
  constructor() {
    jamid.events.onConversationRequestReceived.subscribe(async (signal) => {
      const conversationRequest = await this.createConversationRequest(signal.accountId, signal.metadata)
      webSocketServer.send(signal.accountId, WebSocketMessageType.ConversationRequest, conversationRequest)
    })
  }

  async createConversationRequest(
    accountId: string,
    jamidRequest: ConversationRequestMetadata,
  ): Promise<IConversationRequest> {
    const contact = await contactService.getContactFromUri(accountId, jamidRequest.from)
    const membersNames = await this.getMembersNames(accountId, jamidRequest.id)

    // Currently, this does not actually works.
    // It seems the members can't be accessed yet. Same on jami-android
    if (membersNames.length === 0) {
      membersNames.push(contact.registeredName || contact.uri)
    }

    return {
      conversationId: jamidRequest.id,
      received: jamidRequest.received,
      from: contact,
      infos: {
        // Build a dataUrl from the avatar
        // TODO: Host the image and use a "normal" url instead
        avatar: jamidRequest.avatar ? `data:image/jpeg;base64,${jamidRequest.avatar}` : undefined,
        description: jamidRequest.description,
        mode: jamidRequest.mode,
        title: jamidRequest.title,
      },
      membersNames,
    }
  }

  async createConversationSummary(
    accountId: string,
    conversationId: string,
  ): Promise<IConversationSummary | undefined> {
    const infos = jamid.getConversationInfos(accountId, conversationId)
    if (Object.keys(infos).length === 0) {
      return undefined
    }
    // Build a dataUrl from the avatar
    // TODO: Host the image and use a "normal" url instead
    infos.avatar = infos.avatar ? `data:image/jpeg;base64,${infos.avatar}` : undefined
    jamid.clearCache(accountId, conversationId)
    const [membersNames, message] = await Promise.all([
      this.getMembersNames(accountId, conversationId),
      jamid.getSwarmMessages(accountId, conversationId, '', 1),
    ])
    const lastMessage: Message = message[0]
    return {
      id: conversationId,
      avatar: infos.avatar,
      title: infos.title,
      mode: infos.mode,
      membersNames,
      lastMessage,
    }
  }

  async getMembersNames(accountId: string, conversationId: string): Promise<string[]> {
    // Retrieve the URI of the current account (Account.username actually stores the URI rather than the username)
    const accountUri = jamid.getAccountDetails(accountId)['Account.username']
    const members = jamid.getConversationMembers(accountId, conversationId)

    const membersNamesPromises = members.map(async (member) => {
      if (member.uri === accountUri) {
        return
      }

      presenceService.subscribe(accountId, member.uri)

      // Add usernames for conversation members
      try {
        const data = await jamid.lookupAddress(member.uri, '', accountId)
        const username = data.name
        return username || member.uri
      } catch (e) {
        return member.uri
      }
    })
    const membersNames = (await Promise.all(membersNamesPromises)).filter((name): name is string => name !== undefined)
    return membersNames
  }
}
