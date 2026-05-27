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

import { createOptionalContext } from '../hooks/createOptionalContext.js'
import { useConversationPreferencesQuery } from '../services/conversationQueries.js'
import { WithChildren } from '../utils/utils.js'
import { useConversationContext } from './ConversationProvider.js'

interface ConversationPreferencesNotificationsContext {
  ignoreNotifications: boolean
  setIgnoreNotifications: (value: boolean) => void
}

const optionalConversationPreferencesNotificationsContext =
  createOptionalContext<ConversationPreferencesNotificationsContext>('ConversationPreferencesNotificationsContext')
const ConversationPreferencesNotificationsContext = optionalConversationPreferencesNotificationsContext.Context
export const useConversationPreferencesNotificationsContext =
  optionalConversationPreferencesNotificationsContext.useOptionalContext

const ConversationPreferencesNotificationsProvider: React.FC<WithChildren> = ({ children }) => {
  const { conversationId } = useConversationContext()
  const preferencesQuery = useConversationPreferencesQuery(conversationId)

  const [ignoreNotifications, setIgnoreNotifications] = useState<boolean>(false)

  useEffect(() => {
    if (preferencesQuery.data) {
      setIgnoreNotifications(preferencesQuery.data.ignoreNotifications ?? false)
    }
  }, [preferencesQuery.data, conversationId])

  const value = useMemo(
    () => ({
      ignoreNotifications,
      setIgnoreNotifications,
    }),
    [ignoreNotifications],
  )

  return (
    <ConversationPreferencesNotificationsContext.Provider value={value}>
      {children}
    </ConversationPreferencesNotificationsContext.Provider>
  )
}

export default ConversationPreferencesNotificationsProvider
