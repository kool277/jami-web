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
import { MessageStatusCode } from '@savoirfairelinux/jami-web-common/src/enums/message-status-code'
import { describe, expect, it } from 'vitest'

import { filterConversationSummaries, isConversationUnread } from './conversationFilters.js'

const summary = (mode: string, author = 'other', status = MessageStatusCode.read) =>
  ({
    mode,
    lastMessage: { author, status: { me: status } },
  }) as never

describe('conversation filters', () => {
  it('keeps every conversation in All', () => {
    expect(filterConversationSummaries([summary('0'), summary('1')], 'all', 'me')).toHaveLength(2)
  })

  it('keeps only incoming unread conversations in Unread', () => {
    const unread = summary('0', 'other', MessageStatusCode.sent)
    expect(isConversationUnread(unread, 'me')).toBe(true)
    expect(filterConversationSummaries([unread, summary('0'), summary('0', 'me')], 'unread', 'me')).toEqual([unread])
  })

  it('keeps only non-direct conversations in Groups', () => {
    const group = summary('1')
    expect(filterConversationSummaries([summary('0'), group], 'groups', 'me')).toEqual([group])
  })
})
