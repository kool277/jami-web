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

import { useQueryClient } from '@tanstack/react-query'
import { IAccountDetails, ProfileReceived, WebSocketMessageType } from 'jami-web-common'
import { useEffect } from 'react'

import { useAuthContext } from '../contexts/AuthProvider'
import { useWebSocketContext } from '../contexts/WebSocketProvider'

interface AccountDetailsListenerProps {
  children: React.ReactNode
}

export default function AccountDetailsListener({ children }: AccountDetailsListenerProps) {
  const { account } = useAuthContext()
  const webSocket = useWebSocketContext()
  const queryClient = useQueryClient()

  useEffect(() => {
    const profileReceivedHandler = (data: ProfileReceived) => {
      queryClient.invalidateQueries({ queryKey: ['picture', data.peer] })
      queryClient.removeQueries({ queryKey: ['picture', data.peer] })
      queryClient.refetchQueries({ queryKey: ['picture', data.peer] })
    }
    webSocket.bind(WebSocketMessageType.ProfileReceived, profileReceivedHandler)
    return () => {
      webSocket.unbind(WebSocketMessageType.ProfileReceived, profileReceivedHandler)
    }
  }, [queryClient, webSocket])

  useEffect(() => {
    const accountDetailsChangedListener = (data: IAccountDetails) => {
      account?.setDetails(data.details)
    }

    webSocket.bind(WebSocketMessageType.AccountDetails, accountDetailsChangedListener)
    return () => {
      webSocket.unbind(WebSocketMessageType.AccountDetails, accountDetailsChangedListener)
    }
  }, [account, webSocket])

  return children
}
