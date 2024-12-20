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
import { IConversationRequest, WebSocketMessageType } from 'jami-web-common'
import { createContext, ReactNode, useEffect, useMemo } from 'react'

import { useAddConversationRequestToCache } from '../services/conversationQueries'
import { useWebSocketContext } from './WebSocketProvider'

// It is not sure yet we want this context to have no value
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IMessengerContext {}

const defaultMessengerContext: IMessengerContext = {}

export const MessengerContext = createContext<IMessengerContext>(defaultMessengerContext)

export default ({ children }: { children: ReactNode }) => {
  const webSocket = useWebSocketContext()

  const addConversationRequestToCache = useAddConversationRequestToCache()

  useEffect(() => {
    const conversationRequestListener = (conversationRequest: IConversationRequest) => {
      addConversationRequestToCache(conversationRequest)
    }

    webSocket.bind(WebSocketMessageType.ConversationRequest, conversationRequestListener)

    return () => {
      webSocket.unbind(WebSocketMessageType.ConversationRequest, conversationRequestListener)
    }
  }, [addConversationRequestToCache, webSocket])

  const value = useMemo<IMessengerContext>(() => ({}), [])

  return <MessengerContext.Provider value={value}>{children}</MessengerContext.Provider>
}
