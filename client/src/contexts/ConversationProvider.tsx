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
import { ConversationInfos, ConversationView, WebSocketMessageType } from 'jami-web-common';
import { useContext, useEffect, useMemo } from 'react';

import LoadingPage from '../components/Loading';
import { createOptionalContext } from '../hooks/createOptionalContext';
import { useConversationDisplayName } from '../hooks/useConversationDisplayName';
import { useUrlParams } from '../hooks/useUrlParams';
import { ConversationMember } from '../models/conversation-member';
import { ConversationRouteParams } from '../router';
import { useConversationInfosQuery, useMembersQuery } from '../services/conversationQueries';
import { WithChildren } from '../utils/utils';
import { useAuthContext } from './AuthProvider';
import { WebSocketContext } from './WebSocketProvider';

interface IConversationContext {
  conversationId: string;
  conversationDisplayName: string;
  conversationInfos: ConversationInfos;
  members: ConversationMember[];
}

const optionalConversationContext = createOptionalContext<IConversationContext>('ConversationContext');
const ConversationContext = optionalConversationContext.Context;
export const useConversationContext = optionalConversationContext.useOptionalContext;

export default ({ children }: WithChildren) => {
  const {
    urlParams: { conversationId },
  } = useUrlParams<ConversationRouteParams>();
  const { accountId, account } = useAuthContext();
  const webSocket = useContext(WebSocketContext);

  const conversationInfosQuery = useConversationInfosQuery(conversationId!);
  const membersQuery = useMembersQuery(conversationId!);

  const isError = useMemo(
    () => conversationInfosQuery.isError || membersQuery.isError,
    [conversationInfosQuery.isError, membersQuery.isError]
  );

  const isLoading = useMemo(
    () => conversationInfosQuery.isLoading || membersQuery.isLoading,
    [conversationInfosQuery.isLoading, membersQuery.isLoading]
  );

  const conversationInfos = conversationInfosQuery.data;
  const members = membersQuery.data;

  const conversationDisplayName = useConversationDisplayName(account, conversationInfos, members);

  useEffect(() => {
    if (!conversationInfos || !conversationId || !webSocket) {
      return;
    }

    const conversationView: ConversationView = {
      conversationId,
    };

    webSocket.send(WebSocketMessageType.ConversationView, conversationView);
  }, [accountId, conversationInfos, conversationId, webSocket]);

  const value = useMemo(() => {
    if (!conversationId || !conversationDisplayName || !conversationInfos || !members) {
      return;
    }

    return {
      conversationId,
      conversationDisplayName,
      conversationInfos,
      members,
    };
  }, [conversationId, conversationDisplayName, conversationInfos, members]);

  if (isLoading) {
    return <LoadingPage />;
  }
  if (isError || !value) {
    return <div>Error loading conversation: {conversationId}</div>;
  }

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
};
