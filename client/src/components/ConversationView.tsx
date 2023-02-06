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
import { Divider, Stack, Typography } from '@mui/material';

import { useCallManagerContext } from '../contexts/CallManagerProvider';
import { useConversationContext } from '../contexts/ConversationProvider';
import CallInterface from '../pages/CallInterface';
import ChatInterface from '../pages/ChatInterface';
import { AddParticipantButton, ShowOptionsMenuButton, StartAudioCallButton, StartVideoCallButton } from './Button';

const ConversationView = () => {
  const { conversationId } = useConversationContext();
  const { callData } = useCallManagerContext();

  if (callData?.conversationId === conversationId) {
    return <CallInterface />;
  }

  return (
    <Stack flexGrow={1} height="100%">
      <ConversationHeader />
      <Divider
        sx={{
          borderTop: '1px solid #E5E5E5',
        }}
      />
      <ChatInterface />
    </Stack>
  );
};

const ConversationHeader = () => {
  const { conversationId, conversationDisplayName } = useConversationContext();
  const { startCall } = useCallManagerContext();

  return (
    <Stack direction="row" padding="16px" overflow="hidden">
      <Stack flex={1} justifyContent="center" whiteSpace="nowrap" overflow="hidden">
        <Typography variant="h3" textOverflow="ellipsis">
          {conversationDisplayName}
        </Typography>
      </Stack>
      <Stack direction="row" spacing="20px">
        <StartAudioCallButton onClick={() => startCall(conversationId)} />
        <StartVideoCallButton onClick={() => startCall(conversationId, true)} />
        <AddParticipantButton />
        <ShowOptionsMenuButton />
      </Stack>
    </Stack>
  );
};

export default ConversationView;
