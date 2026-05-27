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

import { NewBuddyNotification, WebSocketMessageType } from 'jami-web-common'
import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import { useWebSocketContext } from '../contexts/WebSocketProvider.js'

interface IPresenceContext {
  getPresence: (buddy: string) => number
  presence: Map<string, number>
}

export const PresenceContext = createContext<IPresenceContext>({
  getPresence: () => 0,
  presence: new Map(),
})

interface PresenceProviderProps {
  children: ReactNode
}

const PresenceProvider: React.FC<PresenceProviderProps> = ({ children }) => {
  const [presence, setPresence] = useState<Map<string, number>>(new Map())
  const webSocket = useWebSocketContext()

  const getPresence = useCallback(
    (buddy: string) => {
      return presence.get(buddy) || 0
    },
    [presence],
  )

  useEffect(() => {
    function handlePresence(data: NewBuddyNotification) {
      setPresence((prev) => {
        const newPresence = new Map(prev)
        newPresence.set(data.buddyUri, data.status)
        return newPresence
      })
    }

    webSocket.bind(WebSocketMessageType.NewBuddyNotification, handlePresence)
    return () => {
      webSocket.unbind(WebSocketMessageType.NewBuddyNotification, handlePresence)
    }
  }, [webSocket])

  const value = useMemo(() => ({ getPresence, presence }), [getPresence, presence])

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
}

export default PresenceProvider
