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
import { useMemo, useState } from 'react'

import { createOptionalContext } from '../hooks/createOptionalContext'
import { WithChildren } from '../utils/utils'

interface IReplyMessageContext {
  message: Message | undefined
  setMessage: (value: Message | undefined) => void
}

const optionalReplyMessageContext = createOptionalContext<IReplyMessageContext>('ReplyMessageContext')
const ReplyMessageContext = optionalReplyMessageContext.Context
export const useReplyMessageContext = optionalReplyMessageContext.useOptionalContext

const ReplyMessageProvider: React.FC<WithChildren> = ({ children }) => {
  const [message, setMessage] = useState<Message | undefined>(undefined)

  const value = useMemo(
    () => ({
      message,
      setMessage,
    }),
    [message, setMessage],
  )

  return <ReplyMessageContext.Provider value={value}>{children}</ReplyMessageContext.Provider>
}

export default ReplyMessageProvider
