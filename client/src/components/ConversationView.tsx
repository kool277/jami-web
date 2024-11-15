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
import { Box, Divider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useState } from 'react'

import { useCallManagerContext } from '../contexts/CallManagerProvider'
import ConversationPreferencesProvider, {
  useConversationPreferencesContext,
} from '../contexts/ConversationPreferencesContext'
import { useConversationContext } from '../contexts/ConversationProvider'
import CallInterface from '../pages/CallInterface'
import ChatInterface from '../pages/ChatInterface'
import AddUserToSwarmModal from './AddUserToSwarmModal'
import { AddParticipantButton } from './Button'
import { ShowOptionsMenuButton, StartAudioCallButton, StartVideoCallButton } from './Button'

const ConversationView = () => {
  const { conversationId } = useConversationContext()
  const { callData } = useCallManagerContext()

  if (callData?.conversationId === conversationId) {
    return <CallInterface />
  }

  return (
    <ConversationPreferencesProvider>
      <Stack flexGrow={1} height="100%" width="100%">
        <ConversationHeader />
        <Divider
          sx={{
            borderTop: '1px solid #E5E5E5',
          }}
        />
        <ChatInterface />
      </Stack>
    </ConversationPreferencesProvider>
  )
}

const ConversationHeader = () => {
  const { conversationId, conversationDisplayName } = useConversationContext()
  const { startCall } = useCallManagerContext()
  const { isOpen, setIsOpen } = useConversationPreferencesContext()
  const [open, setOpen] = useState<boolean>(false)
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const isMedium: boolean = useMediaQuery(theme.breakpoints.only('sm'))

  function getMaxWidth() {
    if (isMobile) {
      return '100px'
    } else if (isMedium) {
      return '70px'
    } else {
      return '150px'
    }
  }

  return (
    <Stack direction="row" padding="16px" overflow="hidden">
      <Stack flex={1} justifyContent="center" whiteSpace="nowrap" overflow="hidden">
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4%' }}>
          <Typography variant="h5" textOverflow="ellipsis" sx={{ maxWidth: getMaxWidth() }}>
            {conversationDisplayName}
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing="20px">
        <StartAudioCallButton onClick={() => startCall(conversationId)} />
        <StartVideoCallButton onClick={() => startCall(conversationId, true)} />
        <AddParticipantButton
          onClick={() => {
            setOpen(true)
          }}
        />
        <AddUserToSwarmModal open={open} setOpen={setOpen} />
        <ShowOptionsMenuButton
          onClick={() => {
            setIsOpen(!isOpen)
          }}
        />
      </Stack>
    </Stack>
  )
}

export default ConversationView
