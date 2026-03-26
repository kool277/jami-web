/*
 * Copyright (C) 2022-2026 Savoir-faire Linux Inc.
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
export type { AccountInfo } from './api/account.js'
export { AccountApi } from './api/account.js'
export { CallApi } from './api/calls.js'
export { ContactApi } from './api/contacts.js'
export { ConversationRequestApi } from './api/conversation-requests.js'
export { ConversationApi } from './api/conversations.js'
export { DataTransferApi } from './api/data-transfer.js'
export { TokenApi } from './api/tokens.js'
export type { ApiTokenInfo, CreateTokenRequest, CreateTokenResponse, TokenScope } from './auth.js'
export { TOKEN_SCOPES } from './auth.js'
export type { CredentialAuthOptions, JamiClientOptions, JamiEventMap, TokenAuthOptions } from './client.js'
export { JamiClient } from './client.js'
export { HttpError } from './http.js'
export { EventClient } from './realtime/event-client.js'

// Re-export common types for convenience
export type {
  AccountDetails,
  ContactDetails,
  ConversationInfos,
  ConversationMessage,
  IContact,
  IConversationMember,
  IConversationRequest,
  IConversationSummary,
  Message,
  WebSocketMessageTable,
} from 'jami-web-common'
export { WebSocketMessageType } from 'jami-web-common'
