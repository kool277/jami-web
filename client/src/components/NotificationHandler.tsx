/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
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
import { ConversationMessage, WebSocketMessageType } from 'jami-web-common'
import { useContext, useEffect, useState } from 'react'

import { useAuthContext } from '../contexts/AuthProvider'
import { NotificationContext } from '../contexts/NotificationsProvider'
import { useWebSocketContext } from '../contexts/WebSocketProvider'
import { useContactQuery } from '../services/contactQueries'
import { useConversationPreferencesQuery } from '../services/conversationQueries'

const SendNotification = (message: string, username: string) => {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission()
  } else {
    const notification = new Notification('@' + username, {
      icon: '/favicon.png',
      body: message,
    })
    notification.onclick = () =>
      function () {
        window.open(window.location.pathname)
      }
  }
}

export default function NotificationHandler({ children }: { children: React.ReactNode }) {
  const { enable } = useContext(NotificationContext)
  const webSocket = useWebSocketContext()
  const { account } = useAuthContext()
  const [contactUri, setContactUri] = useState<string>('')
  const [conversationId, setConversationId] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const contactQuery = useContactQuery(contactUri)
  const preferencesQuery = useConversationPreferencesQuery(conversationId)

  useEffect(() => {
    const fetchData = async () => {
      const contactData = await contactQuery.refetch()
      const conversationData = await preferencesQuery.refetch()

      let conversationIsMuted = false
      if (conversationData.data?.ignoreNotifications) {
        conversationIsMuted = true
      }

      if (message !== '' && message !== undefined && !conversationIsMuted) {
        SendNotification(message, contactData.data?.displayName || contactUri)
      }
    }

    fetchData()
  }, [contactQuery, preferencesQuery, contactUri, conversationId, message])

  useEffect(() => {
    const ConversationMessageListener = (data: ConversationMessage) => {
      if (enable && data.message.author !== account.getUri() && data.message.author !== undefined) {
        setConversationId(data.conversationId)
        setContactUri(data.message.author)
        setMessage(data.message.body)
      }
    }
    webSocket.bind(WebSocketMessageType.ConversationMessage, ConversationMessageListener)
    return () => {
      webSocket.unbind(WebSocketMessageType.ConversationMessage, ConversationMessageListener)
    }
  }, [account, contactUri, enable, webSocket])

  return <>{children}</>
}
