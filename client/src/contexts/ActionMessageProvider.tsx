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

import { Message } from 'jami-web-common'
import { useCallback, useMemo, useState } from 'react'

import { createOptionalContext } from '../hooks/createOptionalContext'
import { WithChildren } from '../utils/utils'

interface IActionMessageContext {
  editMessage: Message | undefined
  setEditMessage: (value: Message | undefined) => void
  replyMessage: Message | undefined
  setReplyMessage: (value: Message | undefined) => void
}

const optionalActionMessageContext = createOptionalContext<IActionMessageContext>('ActionMessageContext')
const ActionMessageContext = optionalActionMessageContext.Context
export const useActionMessageContext = optionalActionMessageContext.useOptionalContext

const ActionMessageProvider: React.FC<WithChildren> = ({ children }) => {
  const [editMessage, setEditMessage] = useState<Message | undefined>(undefined)
  const [replyMessage, setReplyMessage] = useState<Message | undefined>(undefined)

  const handleSetEditMessage = useCallback(
    (value: Message | undefined) => {
      setEditMessage(value)
      setReplyMessage(undefined)
    },
    [setReplyMessage],
  )

  const handleSetReplyMessage = useCallback(
    (value: Message | undefined) => {
      setReplyMessage(value)
      setEditMessage(undefined)
    },
    [setReplyMessage],
  )

  const value = useMemo(
    () => ({
      editMessage,
      replyMessage,
      setReplyMessage: handleSetReplyMessage,
      setEditMessage: handleSetEditMessage,
    }),
    [editMessage, handleSetEditMessage, handleSetReplyMessage, replyMessage],
  )

  return <ActionMessageContext.Provider value={value}>{children}</ActionMessageContext.Provider>
}

export default ActionMessageProvider
