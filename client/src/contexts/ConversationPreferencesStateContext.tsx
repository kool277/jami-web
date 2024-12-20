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
import { useMemo, useState } from 'react'

import { createOptionalContext } from '../hooks/createOptionalContext'
import { WithChildren } from '../utils/utils'

interface ConversationPreferencesStateContext {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
}

const optionalConversationPreferencesStateContext = createOptionalContext<ConversationPreferencesStateContext>(
  'ConversationPreferencesStateContext',
)
const ConversationPreferencesStateContext = optionalConversationPreferencesStateContext.Context
export const useConversationPreferencesStateContext = optionalConversationPreferencesStateContext.useOptionalContext

const ConversationPreferencesStateProvider: React.FC<WithChildren> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const value = useMemo(
    () => ({
      isOpen,
      setIsOpen,
    }),
    [isOpen],
  )

  return (
    <ConversationPreferencesStateContext.Provider value={value}>
      {children}
    </ConversationPreferencesStateContext.Provider>
  )
}

export default ConversationPreferencesStateProvider
