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
import { describe, expect, it } from 'vitest'

import { normalizeConversationRequests } from './conversationQueries.js'

const request = {
  conversationId: 'request-id',
  infos: {},
  from: { uri: 'contact-uri' },
  received: '0',
  membersNames: [],
}

describe('normalizeConversationRequests', () => {
  it('normalizes a single received request into an array', () => {
    expect(normalizeConversationRequests(request)).toEqual([request])
  })

  it('preserves request arrays', () => {
    expect(normalizeConversationRequests([request])).toEqual([request])
  })
})
