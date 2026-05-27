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

import { Box, Modal, useTheme } from '@mui/material'
import { motion } from 'framer-motion'
import { Message, ReactionRemoved, WebSocketMessageType } from 'jami-web-common'
import { memo, useCallback, useMemo, useState } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuthContext } from '../contexts/AuthProvider.js'
import { useConversationContext } from '../contexts/ConversationProvider.js'
import { useWebSocketContext } from '../contexts/WebSocketProvider.js'
import EllipsisMiddle from './EllipsisMiddle.js'
import { CloseIcon } from './SvgIcon.js'

export interface MessageReactionProps {
  message: Message
}

const MessageReaction = ({ message }: MessageReactionProps) => {
  interface ReactionAttributes {
    body: string
    id: string
    amount: number
  }
  const webSocket = useWebSocketContext()
  const { t } = useTranslation()
  const { conversationId } = useConversationContext()
  const [isOpen, setIsOpen] = useState(false)
  const { members } = useConversationContext()
  const { account } = useAuthContext()
  const isAccount = account.getUri() === message.author
  const membersMap = useMemo(() => new Map(members.map((member) => [member.contact.uri, member])), [members])
  const theme = useTheme()
  const generateReactionsArray = useCallback(() => {
    const reactionAttributesArray: Array<ReactionAttributes> = []

    for (const reaction of message.reactions) {
      if (reaction.id !== undefined) {
        const index = reactionAttributesArray.findIndex((element) => element.body === reaction.body)
        if (index === -1) {
          reactionAttributesArray.push({ body: reaction.body, id: reaction.id, amount: 1 })
        } else {
          if (reactionAttributesArray[index].amount !== undefined) {
            reactionAttributesArray[index].amount += 1
          }
        }
      }
    }

    return reactionAttributesArray
  }, [message.reactions])

  const [reactionsArray, setReactionsArray] = useState<Array<ReactionAttributes>>(() => generateReactionsArray())

  useEffect(() => {
    setReactionsArray(() => generateReactionsArray())
    if (message.reactions.length === 0) {
      setIsOpen(false)
    }
  }, [generateReactionsArray, message.reactions])

  const container = {
    hidden: { opacity: 1, scale: 1.25 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delayChildren: 0.4,
        staggerChildren: 0.2,
      },
    },
  }
  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  }

  function handleCloseModal() {
    setIsOpen(false)
  }

  const handleDeleteReaction = (reactionId: string) => {
    const data: ReactionRemoved = {
      conversationId: conversationId,
      messageId: message.id,
      reactionId: reactionId,
    }

    webSocket.send(WebSocketMessageType.ReactionRemoved, data)
  }

  const sortedReactionsArray = useMemo(() => {
    return [...reactionsArray].sort((a, b) => (b.amount || 0) - (a.amount || 0))
  }, [reactionsArray])

  if (reactionsArray.length === 0) {
    return null
  }

  return (
    <>
      <Box data-cy="emoji-reaction-list" onClick={() => setIsOpen(!isOpen)} sx={{ ':hover': { cursor: 'pointer' } }}>
        <motion.div
          initial={message.animate ? 'hidden' : undefined}
          animate={message.animate ? 'visible' : undefined}
          variants={message.animate ? container : undefined}
          style={
            message.animate
              ? {
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'nowrap',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '15px',
                  backgroundColor: 'rgba(0,0,0,0.0)',
                  paddingLeft: '7px',
                  paddingRight: '5px',
                  paddingBottom: '2px',
                  paddingTop: '2px',
                  marginTop: '-4px',
                  marginBottom: '5px',
                  marginRight: isAccount ? '45px' : '0px',
                  marginLeft: isAccount ? '0px' : '65px',
                  boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
                }
              : undefined
          }
        >
          {sortedReactionsArray.slice(0, 3).map((reaction: ReactionAttributes) => (
            <motion.span variants={message.animate ? item : undefined} key={reaction.id}>
              {reaction.body}
            </motion.span>
          ))}
        </motion.div>
      </Box>

      <Modal
        open={isOpen}
        onClose={handleCloseModal}
        sx={{
          width: '350px',
          height: 'auto',
          maxHeight: '40%',
          position: 'absolute',
          borderRadius: '15px',
          border: 'none',
          backgroundColor: theme.InfoTooltip.backgroundColor.main,
          alignContent: 'center',
          alignItems: 'center',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.InfoTooltip.backgroundColor.main,
            borderRadius: '15px',
            padding: '10px',
            display: 'flex',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
            <CloseIcon
              sx={{
                padding: '5px',
                fontSize: '30px',
                borderRadius: '12px',
                ':hover': {
                  cursor: 'pointer',
                  backgroundColor: theme.ChatInterface.reactionModalBackground,
                  transition: 'background-color 0.25s ease-in-out',
                },
              }}
              onClick={() => handleCloseModal()}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              alignContent: 'center',
            }}
          >
            {message.reactions.map((reaction) => {
              const author = membersMap.get(reaction.author)?.contact.uri
              return (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    gap: 2,
                    width: '75%',
                    textAlign: 'center',
                  }}
                  key={reaction.id}
                >
                  {author === account.getUri() ? (
                    <>
                      <Box>{t('yourself')}</Box>
                      <Box
                        sx={{ ':hover': { cursor: 'pointer', transform: 'scale(1.2)' } }}
                        onClick={() => reaction.id && handleDeleteReaction(reaction.id)}
                      >
                        {reaction.body}
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box sx={{ maxWidth: '200px' }}>
                        <EllipsisMiddle text={author || t('unknown')} />
                      </Box>
                      <Box>{reaction.body}</Box>
                    </>
                  )}
                </Box>
              )
            })}
          </Box>
        </Box>
      </Modal>
    </>
  )
}

export default memo(MessageReaction)
