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
import { ConversationMemberRole } from '@savoirfairelinux/jami-web-common'
import { describe, expect, it } from 'vitest'

import { Contact } from '../models/contact.js'
import { ConversationMember } from '../models/conversation-member.js'
import { callPeers } from './callPeers.js'

const member = (uri: string, role: ConversationMemberRole = 'member') => new ConversationMember(role, new Contact(uri))
const uris = (members: ConversationMember[]) => members.map((m) => m.contact.uri)

describe('callPeers', () => {
  it('leaves out this account, wherever the conversation lists it', () => {
    // The daemon lists the conversation's creator first, so the caller is often members[0].
    expect(uris(callPeers([member('bob', 'admin'), member('carol')], 'bob'))).toEqual(['carol'])
    expect(uris(callPeers([member('bob', 'admin'), member('carol')], 'carol'))).toEqual(['bob'])
  })

  it('keeps every other member of a group, in order', () => {
    const members = [member('bob', 'admin'), member('carol'), member('dave'), member('erin', 'invited')]
    expect(uris(callPeers(members, 'carol'))).toEqual(['bob', 'dave', 'erin'])
  })

  it('leaves out members who left or were banned', () => {
    const members = [member('bob', 'admin'), member('carol', 'left'), member('dave', 'banned'), member('erin')]
    expect(uris(callPeers(members, 'bob'))).toEqual(['erin'])
  })

  it('has no peers before the members are known', () => {
    expect(callPeers(undefined, 'bob')).toEqual([])
  })
})
