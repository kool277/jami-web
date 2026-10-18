/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
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
import { ConversationMember } from '../models/conversation-member.js'

/**
 * The members of a conversation a call connects this account to: every member but this account
 * itself, in the conversation's order, leaving out those who left or were banned.
 */
export function callPeers(members: readonly ConversationMember[] | undefined, localUri: string): ConversationMember[] {
  return (members ?? []).filter(
    (member) => member.contact.uri !== localUri && member.role !== 'left' && member.role !== 'banned',
  )
}
