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

import { describe, expect, it } from 'vitest'

import { JamiClient } from '../src/client.js'

const server = process.env.JAMI_TEST_SERVER
const token = process.env.JAMI_TEST_TOKEN
const liveIt = server && token ? it : it.skip

describe('ConversationApi live', () => {
  liveIt(
    'resolves an older message exactly by id against a live Jami server',
    async () => {
      const client = new JamiClient({ server: server!, token: token! })
      const conversations = await client.conversations.list()

      let targetConversationId: string | undefined
      let targetMessageId: string | undefined

      for (const conversation of conversations) {
        const recentMessages = await client.conversations.getMessages(conversation.id, { limit: 3 })
        if (recentMessages.length >= 2) {
          targetConversationId = conversation.id
          targetMessageId = recentMessages[1].id
          break
        }
      }

      expect(targetConversationId).toBeTruthy()
      expect(targetMessageId).toBeTruthy()

      const resolved = await client.conversations.getMessage(targetConversationId!, targetMessageId!)

      expect(resolved?.id).toBe(targetMessageId)
    },
    20000,
  )
})
