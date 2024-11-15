/*
 * Copyright (C) 2022-2024 Savoir-faire Linux Inc.
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

import { useEffect, useMemo, useState } from 'react'

import { createOptionalContext } from '../hooks/createOptionalContext'
import { useConversationPreferencesQuery } from '../services/conversationQueries'
import { getColor } from '../utils/messagecolor'
import { WithChildren } from '../utils/utils'
import { useConversationContext } from './ConversationProvider'

interface ConversationPreferencesContext {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  isSwarmGroup: boolean
  conversationColor: string
  setConversationColor: (value: string) => void
  ignoreNotifications: boolean
  setIgnoreNotifications: (value: boolean) => void
}

const optionalConversationPreferencesContext = createOptionalContext<ConversationPreferencesContext>(
  'ConversationPreferencesContext',
)
const ConversationPreferencesContext = optionalConversationPreferencesContext.Context
export const useConversationPreferencesContext = optionalConversationPreferencesContext.useOptionalContext

const ConversationPreferencesProvider: React.FC<WithChildren> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isSwarmGroup, setIsSwarmGroup] = useState<boolean>(false)
  const { members, conversationId } = useConversationContext()
  const preferencesQuery = useConversationPreferencesQuery(conversationId)
  const [conversationColor, setConversationColor] = useState<string>(getColor(conversationId))
  const [ignoreNotifications, setIgnoreNotifications] = useState<boolean>(false)

  useEffect(() => {
    if (members.length > 2) {
      setIsSwarmGroup(true)
    } else {
      setIsSwarmGroup(false)
    }

    setConversationColor(preferencesQuery.data?.color ?? getColor(conversationId))

    if (preferencesQuery.data?.ignoreNotifications !== undefined) {
      setIgnoreNotifications(preferencesQuery.data.ignoreNotifications)
    }
  }, [conversationId, members, preferencesQuery])

  useEffect(() => {
    setIsOpen(false)
  }, [conversationId])

  const value = useMemo(
    () => ({
      ignoreNotifications,
      setIgnoreNotifications,
      isOpen,
      setIsOpen,
      isSwarmGroup,
      conversationColor,
      setConversationColor,
    }),
    [
      ignoreNotifications,
      setIgnoreNotifications,
      isOpen,
      setIsOpen,
      isSwarmGroup,
      conversationColor,
      setConversationColor,
    ],
  )
  return <ConversationPreferencesContext.Provider value={value}>{children}</ConversationPreferencesContext.Provider>
}
export default ConversationPreferencesProvider
