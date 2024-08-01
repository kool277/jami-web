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
import { RemoteVideoOverlay } from '../components/VideoOverlay'
import { createOptionalContext } from '../hooks/createOptionalContext'
import { useUrlParams } from '../hooks/useUrlParams'
import { ConversationRouteParams } from '../router'
import { ICallManager, useCallManager } from '../services/CallManager'
import { WithChildren } from '../utils/utils'

const optionalCallManagerContext = createOptionalContext<ICallManager>('CallManagerContext')
export const useCallManagerContext = optionalCallManagerContext.useOptionalContext

export default ({ children }: WithChildren) => {
  const { urlParams } = useUrlParams<ConversationRouteParams>()
  const callManager = useCallManager()

  const { callData } = callManager

  return (
    <optionalCallManagerContext.Context.Provider value={callManager}>
      {callData && callData.conversationId !== urlParams.conversationId && (
        <RemoteVideoOverlay callConversationId={callData.conversationId} />
      )}
      {children}
    </optionalCallManagerContext.Context.Provider>
  )
}
