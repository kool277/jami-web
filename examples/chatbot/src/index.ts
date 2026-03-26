/*
 * Copyright (C) 2025 Savoir-faire Linux Inc.
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

import { JamiClient, WebSocketMessageType } from '@savoirfairelinux/jami-sdk'

function buildClient(): JamiClient {
  const server = process.env.JAMI_SERVER ?? 'http://localhost:5002'
  const token = process.env.JAMI_TOKEN

  if (token) {
    return new JamiClient({ server, token })
  }

  const username = process.env.JAMI_USERNAME
  const password = process.env.JAMI_PASSWORD

  if (!username || !password) {
    throw new Error('Set JAMI_TOKEN or JAMI_USERNAME and JAMI_PASSWORD to run the chatbot example.')
  }

  return new JamiClient({
    server,
    credentials: {
      username,
      password,
      authMethod: process.env.JAMI_AUTH_METHOD === 'jams' ? 'jams' : 'local',
    },
  })
}

async function main() {
  const client = buildClient()
  const account = await client.account.get()
  const ourUri = account.details['Account.username'] ?? ''
  const handledMessageIds = new Set<string>()

  const handleMessage = async (
    conversationId: string,
    message: { id?: string; author?: string; type?: string; body?: unknown },
  ) => {
    if (!message.id || handledMessageIds.has(message.id)) return
    handledMessageIds.add(message.id)

    if (message.author === ourUri) return
    if (message.type !== 'text/plain') return

    const body = typeof message.body === 'string' ? message.body : ''
    if (!body) return

    console.log(`[${conversationId.slice(0, 8)}...] ${message.author?.slice(0, 8)}...: ${body}`)

    if (body.toLowerCase() === '/help') {
      await client.conversations.sendMessage(
        conversationId,
        'Echo Bot Commands:\n' +
          '  /help  - Show this help\n' +
          '  /info  - Show conversation info\n' +
          '  /ping  - Pong!\n' +
          '  (anything else is echoed back)',
      )
      return
    }

    if (body.toLowerCase() === '/ping') {
      await client.conversations.sendMessage(conversationId, 'Pong!')
      return
    }

    if (body.toLowerCase() === '/info') {
      const members = await client.conversations.getMembers(conversationId)
      const infos = await client.conversations.getInfos(conversationId)
      await client.conversations.sendMessage(
        conversationId,
        `Conversation: ${conversationId}\nMembers: ${members.length}\nTitle: ${infos.title ?? '(none)'}`,
      )
      return
    }

    await client.conversations.sendMessage(conversationId, `Echo: ${body}`)
  }

  console.log('Starting Jami Echo Bot...')
  console.log(`Server: ${process.env.JAMI_SERVER ?? 'http://localhost:5002'}`)
  console.log(`Address: ${ourUri || account.id}`)

  const conversations = await client.conversations.list()
  console.log(`Active conversations: ${conversations.length}`)

  const pendingRequests = await client.conversationRequests.list()
  for (const request of pendingRequests) {
    console.log(`Accepting pending conversation request: ${request.conversationId}`)
    await client.conversationRequests.accept(request.conversationId)
  }

  await client.events.connect()

  const stopConversationRequest = client.events.on(WebSocketMessageType.ConversationRequest, async (request) => {
    console.log(`Accepting conversation request: ${request.conversationId}`)
    await client.conversationRequests.accept(request.conversationId)
  })

  const stopConversationMessage = client.events.on(
    WebSocketMessageType.ConversationMessage,
    async ({ conversationId, message }) => {
      await handleMessage(conversationId, message)
    },
  )

  function shutdown() {
    console.log('\nShutting down...')
    stopConversationRequest()
    stopConversationMessage()
    client.events.disconnect()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  console.log('Bot is running! Listening for messages... (Ctrl+C to stop)')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
