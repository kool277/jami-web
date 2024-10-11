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

import { Box } from '@mui/material'
import { motion } from 'framer-motion'
import { Message } from 'jami-web-common'
import { MessageStatusCode } from 'jami-web-common/src/enums/message-status-code'
import { useCallback, useContext, useEffect, useState } from 'react'

import { useAuthContext } from '../contexts/AuthProvider'
import { useConversationContext } from '../contexts/ConversationProvider'
import SentIcon from '../icons/sentIcon.svg?react'
import { currentLastSeenMessageContext } from '../pages/ChatInterface'
import ConversationAvatar from './ConversationAvatar'

export interface MessageStatusProps {
  message: Message
}

export default function MessageStatus({ message }: MessageStatusProps) {
  const avatarSize: string = '15px'
  const { account } = useAuthContext()
  const [highestStatus, setHighestStatus] = useState<MessageStatusCode>(MessageStatusCode.sending)
  const { members } = useConversationContext()
  const messageStatus = useContext(currentLastSeenMessageContext)

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
        return peers.map((peerId) => {
          const member = members.find((member) => peerId === member.contact.uri)
          return (
            <ConversationAvatar
              contactUri={peerId}
              key={peerId}
              displayName={member?.getDisplayName()}
              sx={{ width: avatarSize, height: avatarSize, fontSize: '12px', ml: 0.1 }}
            />
          )
        })
      }

      if (highestStatus === MessageStatusCode.read) {
        return null
      } else {
        switch (highestStatus) {
          case MessageStatusCode.sending:
            return <>...</>
          case MessageStatusCode.sent:
            return <SentIcon width="15px" />
          default:
            return <SentIcon width="15px" />
        }
      }
    },
    [account, highestStatus, members, messageStatus],
  )

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        justifyContent: 'flex-end',
        width: '7px',
      }}
    >
      <motion.div
        data-cy="message-status-icon"
        variants={message.animate ? item : undefined}
        initial={message.animate ? 'hidden' : undefined}
        animate={message.animate ? 'visible' : undefined}
        transition={message.animate ? { delay: 0.3 } : undefined}
      >
        {DisplayedIcon(message)}
      </motion.div>
    </Box>
  )
}
