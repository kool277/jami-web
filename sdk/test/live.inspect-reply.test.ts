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
const conversationId = process.env.JAMI_TEST_CONVERSATION_ID
const messageId = process.env.JAMI_TEST_MESSAGE_ID
const liveIt = server && token && conversationId && messageId ? it : it.skip

function getRelatedIds(message: {
  'reply-to'?: string | { id?: string }
  linearizedParent?: string
  parents?: string
}): string[] {
  const replyTo = typeof message['reply-to'] === 'string' ? message['reply-to'] : message['reply-to']?.id
  const linearizedParent = message.linearizedParent || undefined
  const parents = (message.parents || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return Array.from(new Set([replyTo, linearizedParent, ...parents].filter(Boolean))) as string[]
}

describe('ConversationApi live reply inspection', () => {
  liveIt(
    'prints the reply chain metadata for a specific message',
    async () => {
      const client = new JamiClient({ server: server!, token: token! })

      const target = await client.conversations.getMessage(conversationId!, messageId!)
      expect(target).toBeTruthy()

      const visited = new Set<string>()
      const queue = [target.id]
      const related: Array<{
        id: string
        author: string | undefined
        body: unknown
        replyTo: string | undefined
        linearizedParent: string | undefined
        parents: string | undefined
      }> = []

      while (queue.length > 0 && related.length < 12) {
        const currentId = queue.shift()!
        if (visited.has(currentId)) continue
        visited.add(currentId)

        const message = await client.conversations.getMessage(conversationId!, currentId)
        if (!message) {
          related.push({
            id: currentId,
            author: undefined,
            body: undefined,
            replyTo: undefined,
            linearizedParent: undefined,
            parents: undefined,
          })
          continue
        }

        const replyTo = typeof message['reply-to'] === 'string' ? message['reply-to'] : message['reply-to']?.id
        related.push({
          id: message.id,
          author: message.author,
          body: message.body,
          replyTo,
          linearizedParent: message.linearizedParent || undefined,
          parents: message.parents || undefined,
        })

        for (const nextId of getRelatedIds(message)) {
          if (!visited.has(nextId)) queue.push(nextId)
        }
      }

      console.log(
        JSON.stringify(
          {
            related,
          },
          null,
          2,
        ),
      )
    },
    20000,
  )
})
