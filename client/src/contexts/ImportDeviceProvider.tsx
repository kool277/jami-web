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

import { DeviceAuthError, DeviceAuthStateChanged, DeviceAuthStateCode, WebSocketMessageType } from 'jami-web-common'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createOptionalContext } from '../hooks/createOptionalContext.js'
import { WithChildren } from '../utils/utils.js'
import { AlertSnackbarContext } from './AlertSnackbarProvider.js'
import { useWebSocketLinkContext } from './WebSocketLinkProvider.js'

interface IImportDeviceContext {
  accountId: string
  state: DeviceAuthStateCode
  token: string
  details: Map<string, string>
  setToken: (token: string) => void
}

const optionalImportDeviceContext = createOptionalContext<IImportDeviceContext>('ImportDeviceContext')
const ImportDeviceContext = optionalImportDeviceContext.Context
export const useImportDeviceContext = optionalImportDeviceContext.useOptionalContext

const ImportDeviceProvider: React.FC<WithChildren> = ({ children }) => {
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const navigate = useNavigate()
  const webSocket = useWebSocketLinkContext()
  const [accountId, setAccountId] = useState<string>('')
  const [state, setState] = useState<DeviceAuthStateCode>(DeviceAuthStateCode.Init)
  const [token, setToken] = useState<string>('')
  const [details, setDetails] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    function handleDeviceAuth(data: DeviceAuthStateChanged) {
      if (accountId === '') {
        setAccountId(data.accountId)
      }

      if (data.state <= state) {
        return
      }

      setState(data.state)
      if (
        data.state !== DeviceAuthStateCode.Init &&
        data.state !== DeviceAuthStateCode.Connecting &&
        data.state !== DeviceAuthStateCode.InProgress &&
        data.details
      ) {
        setDetails(new Map(Object.entries(data.details)))
      }
      switch (data.state) {
        case DeviceAuthStateCode.Connecting:
          navigate('/import-account-connecting')
          break
        case DeviceAuthStateCode.Authenticating:
          // if the user has a password we need to ask for the password
          // if a password is set
          navigate('/import-account-unlock')
          break
        case DeviceAuthStateCode.InProgress:
          // the user has confirmed on the old device now
          navigate('/import-account-in-progress')
          break
        case DeviceAuthStateCode.Done:
          // help the user create a password for the server web
          // verify that the status is not errored else, we have to restart the process
          if (data.details.get('error') === DeviceAuthError.Success) {
            navigate('/import-account-done')
            break
          }

          if (data.details.get('error') === DeviceAuthError.Authentication) {
            setAlertContent({
              messageI18nKey: 'device_auth_error_authentication',
              severity: 'error',
              alertOpen: true,
            })
            navigate('/import-account')
            break
          }

          if (data.details.get('error') === DeviceAuthError.Network) {
            setAlertContent({
              messageI18nKey: 'device_auth_error_network',
              severity: 'error',
              alertOpen: true,
            })
            navigate('/import-account')
            break
          }
      }
    }
    webSocket.bind(WebSocketMessageType.DeviceAuthStateChanged, handleDeviceAuth)
    return () => {
      webSocket.unbind(WebSocketMessageType.DeviceAuthStateChanged, handleDeviceAuth)
    }
  }, [accountId, navigate, setAlertContent, webSocket, state])

  const value = useMemo(
    () => ({
      details,
      state,
      accountId,
      token,
      setToken,
      setAccountId,
    }),
    [accountId, details, state, token],
  )

  return <ImportDeviceContext.Provider value={value}>{children}</ImportDeviceContext.Provider>
}

export default ImportDeviceProvider
