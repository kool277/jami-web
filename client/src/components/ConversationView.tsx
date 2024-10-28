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
import MenuOpenIcon from '@mui/icons-material/MenuOpen'
import { Box, Divider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import { useCallManagerContext } from '../contexts/CallManagerProvider'
import { useConversationContext } from '../contexts/ConversationProvider'
import CallInterface from '../pages/CallInterface'
import ChatInterface from '../pages/ChatInterface'
import AddUserToSwarmModal from './AddUserToSwarmModal'
import { ShowOptionsMenuButton, StartAudioCallButton, StartVideoCallButton } from './Button'

const ConversationView = () => {
  const { conversationId } = useConversationContext()
  const { callData } = useCallManagerContext()

  if (callData?.conversationId === conversationId) {
    return <CallInterface />
  }

  return (
    <Stack flexGrow={1} height="100%" width="100%">
      <ConversationHeader />
      <Divider
        sx={{
          borderTop: '1px solid #E5E5E5',
        }}
      />
      <ChatInterface />
    </Stack>
  )
}

const ConversationHeader = () => {
  const { conversationId, conversationDisplayName } = useConversationContext()
  const { startCall } = useCallManagerContext()

  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const navigate = useNavigate()

  return (
    <Stack direction="row" padding="16px" overflow="hidden">
      <Stack flex={1} justifyContent="center" whiteSpace="nowrap" overflow="hidden">
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4%' }}>
          {isMobile && <MenuOpenIcon sx={{ '&:hover': { cursor: 'pointer' } }} onClick={() => navigate('/')} />}
          <Typography variant="h5" textOverflow="ellipsis">
            {conversationDisplayName}
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing="20px">
        <StartAudioCallButton onClick={() => startCall(conversationId)} />
        <StartVideoCallButton onClick={() => startCall(conversationId, true)} />
        <AddUserToSwarmModal />
        <ShowOptionsMenuButton />
      </Stack>
    </Stack>
  )
}

export default ConversationView
