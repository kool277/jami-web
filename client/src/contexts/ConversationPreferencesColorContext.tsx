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
import { useEffect, useMemo, useState } from 'react'

import { createOptionalContext } from '../hooks/createOptionalContext'
import { useConversationPreferencesQuery } from '../services/conversationQueries'
import { getColor } from '../utils/messagecolor'
import { WithChildren } from '../utils/utils'
import { useConversationContext } from './ConversationProvider'

interface ConversationPreferencesColorContext {
  conversationColor: string
  setConversationColor: (value: string) => void
}

const optionalConversationPreferencesColorContext = createOptionalContext<ConversationPreferencesColorContext>(
  'ConversationPreferencesColorContext',
)
const ConversationPreferencesColorContext = optionalConversationPreferencesColorContext.Context
export const useConversationPreferencesColorContext = optionalConversationPreferencesColorContext.useOptionalContext

const ConversationPreferencesColorProvider: React.FC<WithChildren> = ({ children }) => {
  const { conversationId } = useConversationContext()
  const preferencesQuery = useConversationPreferencesQuery(conversationId)

  const [conversationColor, setConversationColor] = useState<string>(
    preferencesQuery.data?.color || getColor(conversationId),
  )

  useEffect(() => {
    if (preferencesQuery.data) {
      setConversationColor(preferencesQuery.data.color || getColor(conversationId))
      return
    }
    setConversationColor(getColor(conversationId))
  }, [preferencesQuery.data, conversationId])

  const value = useMemo(
    () => ({
      conversationColor,
      setConversationColor,
    }),
    [conversationColor],
  )

  return (
    <ConversationPreferencesColorContext.Provider value={value}>
      {children}
    </ConversationPreferencesColorContext.Provider>
  )
}

export default ConversationPreferencesColorProvider
