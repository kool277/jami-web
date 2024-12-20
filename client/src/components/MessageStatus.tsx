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
import { useTheme } from '@mui/material'
import { Box } from '@mui/material'
import { motion } from 'framer-motion'
import { Message } from 'jami-web-common'
import { MessageStatusCode } from 'jami-web-common/src/enums/message-status-code'
import { useCallback, useContext, useEffect, useState } from 'react'

import { currentLastSeenMessageContext } from '../components/ChatInterfaceManager'
import { useAuthContext } from '../contexts/AuthProvider'
import { useConversationContext } from '../contexts/ConversationProvider'
import SendingIcon from '../icons/sendingIcon.svg?react'
import SentIcon from '../icons/sentIcon.svg?react'
import AvatarMouseOver from './AvatarMouseOver'

export interface MessageStatusProps {
  message: Message
}
export default function MessageStatus({ message }: MessageStatusProps) {
  const { account } = useAuthContext()
  const [highestStatus, setHighestStatus] = useState<MessageStatusCode | undefined>()
  const { members } = useConversationContext()
  const messageStatus = useContext(currentLastSeenMessageContext)
  const theme = useTheme()

  useEffect(() => {
    let highest = MessageStatusCode.sending
    for (const [peerId, status] of Object.entries(message.status)) {
      if (status > highest && peerId !== account.getUri()) {
        highest = status
      }
    }
    setHighestStatus(highest)
  }, [message, messageStatus, account])

  const DisplayedIcon = useCallback(
    (message: Message) => {
      if (message.author !== account.getUri()) {
        return <></>
      }
      const peers = []
      for (const [peerId, messageId] of messageStatus.entries()) {
        if (message.id === messageId) {
          peers.push(peerId)
        }
      }

      if (peers.length > 0) {
        return (
          <Box display="flex" position="relative" sx={{ gap: '0' }}>
            {peers.map((peerId, index) => {
              const member = members.find((member) => peerId === member.contact.uri)
              return (
                <Box
                  key={peerId}
                  sx={{
                    position: 'absolute',
                    right: `${index * 14}px`,
                    zIndex: 1,
                    border: theme.StatusIcon.border,
                    borderRadius: '25px',
                  }}
                >
                  <AvatarMouseOver
                    key={peerId}
                    contactUri={peerId}
                    displayName={member?.getDisplayName() || member?.contact.registeredName || peerId}
                  />
                </Box>
              )
            })}
          </Box>
        )
      }

      const messageSentIconWidth = '15px'
      if (highestStatus === MessageStatusCode.read) {
        return null
      } else {
        switch (highestStatus) {
          case MessageStatusCode.sending:
            return (
              <SendingIcon
                style={{ color: theme.StatusIcon.color, stroke: theme.StatusIcon.color, fill: theme.StatusIcon.color }}
                width={messageSentIconWidth}
              />
            )
          case MessageStatusCode.sent:
            return <SentIcon width={messageSentIconWidth} />
          default:
            return null
        }
      }
    },
    [account, highestStatus, members, messageStatus, theme],
  )

  const Icon = DisplayedIcon(message)
  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  }
  const styles = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-end',
    padding: '3px',
  }
  return (
    <motion.div
      style={styles as any}
      data-cy="message-status-icon"
      variants={message.animate ? item : undefined}
      initial={message.animate ? 'hidden' : undefined}
      animate={message.animate ? 'visible' : undefined}
      transition={message.animate ? { delay: 0.3 } : undefined}
    >
      <Box>{Icon}</Box>
    </motion.div>
  )
}
