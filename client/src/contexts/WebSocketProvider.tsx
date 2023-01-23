/*
 * Copyright (C) 2022 Savoir-faire Linux Inc.
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
import { createContext, useEffect, useMemo, useRef } from 'react';

import { WebSocketClient } from '../services/WebSocketClient';
import { apiUrl } from '../utils/constants';
import { WithChildren } from '../utils/utils';
import { useAuthContext } from './AuthProvider';

export interface IWebSocketContext {
  bind: WebSocketClient['bind'];
  unbind: WebSocketClient['unbind'];
  send: WebSocketClient['send'];
}

export const WebSocketContext = createContext<IWebSocketContext | undefined>(undefined);

export default ({ children }: WithChildren) => {
  const webSocketClientRef = useRef<WebSocketClient>(new WebSocketClient());

  const { token: accessToken } = useAuthContext();

  useEffect(() => {
    webSocketClientRef.current.connect(apiUrl, accessToken);
  }, [accessToken]);

  const value: IWebSocketContext = useMemo(
    () => ({
      bind: webSocketClientRef.current.bind.bind(webSocketClientRef.current),
      unbind: webSocketClientRef.current.unbind.bind(webSocketClientRef.current),
      send: webSocketClientRef.current.send.bind(webSocketClientRef.current),
    }),
    []
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};
