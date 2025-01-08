/*
 * Copyright (C) 2022-2025 Savoir-faire Linux Inc.
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
import { Typography, useTheme } from '@mui/material'
import { Box, Stack, useMediaQuery } from '@mui/system'
import { Message, WebSocketMessageType } from 'jami-web-common'
import { memo, MutableRefObject, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Waypoint } from 'react-waypoint'

import { useAuthContext } from '../contexts/AuthProvider'
import { useConversationContext } from '../contexts/ConversationProvider'
import { useWebSocketContext } from '../contexts/WebSocketProvider'
import { findNextVisibleMessage, findPreviousVisibleMessage, MessageRow } from './Message'
import { ArrowDownIcon } from './SvgIcon'

const MemoizedMessageRow = memo(MessageRow, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.body === nextProps.message.body &&
    prevProps.message.reactions === nextProps.message.reactions &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.editions === nextProps.message.editions &&
    prevProps.message['reply-to'] === nextProps.message['reply-to'] &&
    prevProps.isAccountMessage === nextProps.isAccountMessage &&
    prevProps.author === nextProps.author &&
    prevProps.previousMessage?.id === nextProps.previousMessage?.id &&
    prevProps.nextMessage?.id === nextProps.nextMessage?.id
  )
})

interface MessageListProps {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
  const { account, accountId } = useAuthContext()
  const { members, conversationId } = useConversationContext()
  const [showScrollButton, setShowScrollButton] = useState(false)
  const listBottomRef = useRef<HTMLElement>()
  const webSocket = useWebSocketContext()
  const lastMessageId = messages[messages.length - 1]?.id

  const loadMoreMessages = () => {
    const args = {
      accountId,
      conversationId,
      lastMessageId,
      limit: 32,
    }
    webSocket.send(WebSocketMessageType.LoadMoreMessages, args)
  }

  return (
    <>
      <Stack flex={1} overflow="auto" padding="0px px" direction="column-reverse" marginBottom="-25px">
        {/* Here is the bottom of the list of messages because of 'column-reverse' */}
        <Box ref={listBottomRef} />
        <Waypoint
          onEnter={() => setShowScrollButton(false)}
          onLeave={() => setShowScrollButton(true)}
          bottomOffset="-50px"
        />
        <Stack direction="column-reverse">
          {
            // most recent messages first
            messages.map((message, index) => {
              const previousMessage = findPreviousVisibleMessage(messages, index)
              const nextMessage = findNextVisibleMessage(messages, index)
              const isAccountMessage = message.author === account.getUri()
              let author
              if (isAccountMessage) {
                author = account
              } else {
                const member = members.find((member) => message.author === member.contact.uri)
                author = member?.contact
              }
              if (!author) {
                return null
              }
              const props = {
                message,
                isAccountMessage,
                author,
                previousMessage,
                nextMessage,
              }
              return <MemoizedMessageRow key={message.id} {...props} />
            })
          }
        </Stack>
        <Waypoint
          onEnter={() => {
            loadMoreMessages()
          }}
          topOffset="-100px"
        />
      </Stack>
      {showScrollButton && (
        <Box position="relative" bottom="15px">
          <Box position="absolute" left="50%" sx={{ transform: 'translate(-50%)', zIndex: 2 }}>
            <ScrollToEndButton listBottomRef={listBottomRef} />
          </Box>
        </Box>
      )}
    </>
  )
}

interface ScrollToEndButtonProps {
  listBottomRef: MutableRefObject<HTMLElement | undefined>
}

const ScrollToEndButton = ({ listBottomRef }: ScrollToEndButtonProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const textColor = 'white'
  return (
    <Stack
      direction="row"
      borderRadius="5px"
      height={isMobile ? '35px' : '30px'}
      alignItems="center"
      padding="0 16px"
      textAlign="center"
      spacing="12px"
      sx={{
        backgroundColor: theme.palette.primary.main, // TODO: use another color
        cursor: 'pointer',
      }}
      onClick={() => listBottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
    >
      <ArrowDownIcon sx={{ fontSize: '14px', color: textColor }} />
      <Typography variant="caption" fontWeight="bold" color={textColor} sx={{ textWrap: 'nowrap' }}>
        {t('messages_scroll_to_end')}
      </Typography>
    </Stack>
  )
}
