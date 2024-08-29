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
import { Box, Divider, Fade, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { AccountMessageStatus, ConversationMessage, Message, WebSocketMessageType } from 'jami-web-common'
import { MessageStatusCode } from 'jami-web-common/src/enums/message-status-code'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'

import { FilePreviewRemovable } from '../components/FilePreview'
import LoadingPage from '../components/Loading'
import MessageList from '../components/MessageList'
import { FileDragOverlay } from '../components/Overlay'
import ReplyToMessage from '../components/ReplyToMessage'
import SendMessageForm from '../components/SendMessageForm'
import { useAuthContext } from '../contexts/AuthProvider'
import { useConversationContext } from '../contexts/ConversationProvider'
import { useReplyMessageContext } from '../contexts/ReplyMessageProvider'
import { useWebSocketContext } from '../contexts/WebSocketProvider'
import { ConversationMember } from '../models/conversation-member'
import { useMessagesQuery, useSendMessageMutation } from '../services/conversationQueries'
import { FileHandler } from '../utils/files'
import { translateEnumeration, TranslateEnumerationOptions } from '../utils/translations'

const ChatInterface = () => {
  const webSocket = useWebSocketContext()
  const { conversationId, members } = useConversationContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const { message: selectedReply, setMessage: setSelectedReply } = useReplyMessageContext()

  const messagesQuery = useMessagesQuery(conversationId)
  const sendMessageMutation = useSendMessageMutation(conversationId)

  const [fileHandlers, setFileHandlers] = useState<FileHandler[]>([])

  const { account } = useAuthContext()
  const [lastSeen, setLastSeen] = useState<Map<string, string>>(new Map())

  const onFilesDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFileHandlers = acceptedFiles.map((file) => new FileHandler(file))
      setFileHandlers((oldFileHandlers) => [...oldFileHandlers, ...newFileHandlers])
    },
    [setFileHandlers],
  )

  const removeFile = useCallback(
    (fileId: string | number) => {
      setFileHandlers((fileHandlers) => fileHandlers.filter((fileHandler) => fileHandler.id !== fileId))
    },
    [setFileHandlers],
  )

  const {
    getRootProps,
    getInputProps,
    open: openFilePicker,
    isDragActive,
  } = useDropzone({
    onDrop: onFilesDrop,
    noClick: true,
    noKeyboard: true,
  })

  useEffect(() => {
    const messageStatusChangeHandler = (data: AccountMessageStatus) => {
      // handle signal
      const messageId = data.messageId
      const status = data.status
      const peerId = data.peer
      if (peerId !== account.getUri()) {
        setMessages((messages) =>
          messages.map((message) => {
            if (message.id === messageId) {
              return {
                ...message,
                status: {
                  ...message.status,
                  [peerId]: status,
                },
              }
            }
            return message
          }),
        )
      }
    }

    webSocket.bind(WebSocketMessageType.AccountMessageStatus, messageStatusChangeHandler)
    return () => {
      webSocket.unbind(WebSocketMessageType.AccountMessageStatus, messageStatusChangeHandler)
    }
  }, [webSocket, account, setMessages])

  useEffect(() => {
    const userView = new Set()
    messages.forEach((message) => {
      if (message.author === account.getUri()) {
        for (const message of messages) {
          if (message.author !== account.getUri()) {
            continue
          }
          for (const [peerId, status] of Object.entries(message.status)) {
            if (peerId === account.getUri()) {
              continue
            }
            if (userView.size === members.length) {
              break
            }
            if (status === MessageStatusCode.read && !userView.has(peerId)) {
              setLastSeen((lastSeen) => new Map(lastSeen.set(peerId, message.id)))
              userView.add(peerId)
            }
          }
        }
      }
    })
    messages.forEach((message) => {
      const messageStatus = JSON.parse(JSON.stringify(message.status))

      if (message.author !== account.getUri() && messageStatus[account.getUri()] !== MessageStatusCode.read) {
        const args = {
          messageId: message.id,
          peer: message.author,
          conversationId: conversationId,
          status: MessageStatusCode.read,
        }
        webSocket.send(WebSocketMessageType.AccountMessageStatus, args)
      }
    })
  }, [messages, webSocket, account, conversationId, members])

  useEffect(() => {
    if (messagesQuery.isSuccess) {
      const sortedMessages = sortMessages(messagesQuery.data)
      setMessages(sortedMessages)
    }
  }, [messagesQuery.isSuccess, messagesQuery.data])

  useEffect(() => {
    setIsLoading(messagesQuery.isLoading)
  }, [messagesQuery.isLoading])

  useEffect(() => {
    setError(messagesQuery.isError)
  }, [messagesQuery.isError])

  const sendMessage = useCallback(
    (message: string, reply?: any) => sendMessageMutation.mutate(message, reply),
    [sendMessageMutation],
  )

  function handleSendMessage(message: string, reply?: any) {
    sendMessage(message, reply)
    setSelectedReply(undefined)
  }

  useEffect(() => {
    const conversationMessageListener = (data: ConversationMessage) => {
      setMessages((messages) => addMessage(messages, data.message))
    }
    webSocket.bind(WebSocketMessageType.ConversationMessage, conversationMessageListener)

    return () => {
      webSocket.unbind(WebSocketMessageType.ConversationMessage, conversationMessageListener)
    }
  }, [webSocket])

  if (isLoading) {
    return <LoadingPage />
  } else if (error) {
    return <div>Error loading {conversationId}</div>
  }

  return (
    <Stack flex={1} overflow="hidden" {...getRootProps()} paddingBottom="16px">
      {isDragActive && <FileDragOverlay />}
      <input {...getInputProps()} />
      <MessageList messages={messages} messageStatus={lastSeen} />
      <ComposingMembersIndicator />
      <Divider
        sx={{
          marginX: '16px',
          borderTop: '1px solid #E5E5E5',
        }}
      />
      {selectedReply !== undefined ? <ReplyToMessage /> : null}
      <SendMessageForm onSend={handleSendMessage} openFilePicker={openFilePicker} reply={selectedReply} />
      {fileHandlers.length > 0 && <FilePreviewsList fileHandlers={fileHandlers} removeFile={removeFile} />}
    </Stack>
  )
}

interface FilePreviewsListProps {
  fileHandlers: FileHandler[]
  removeFile: (fileId: string | number) => void
}

const FilePreviewsList = ({ fileHandlers, removeFile }: FilePreviewsListProps) => {
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap="16px"
      overflow="auto"
      maxHeight="30%"
      paddingX="16px"
      marginTop="12px" // spacing with the component on top
      paddingTop="4px" // spacing so "RemoveButton" are not cut
    >
      {fileHandlers.map((fileHandler) => (
        <FilePreviewRemovable
          key={fileHandler.id}
          remove={() => removeFile(fileHandler.id)}
          fileHandler={fileHandler}
          borderColor={'#005699' /* Should be same color as message bubble */}
        />
      ))}
    </Stack>
  )
}

export const ComposingMembersIndicator = () => {
  const { t } = useTranslation()
  const { composingMembers } = useConversationContext()

  const text = useMemo(() => {
    const options: TranslateEnumerationOptions<ConversationMember> = {
      elementPartialKey: 'member',
      getElementValue: (member) => member.getDisplayName(),
      translaters: [
        () => '',
        (interpolations) => t('are_composing_1', interpolations),
        (interpolations) => t('are_composing_2', interpolations),
        (interpolations) => t('are_composing_3', interpolations),
        (interpolations) => t('are_composing_more', interpolations),
      ],
    }

    return translateEnumeration<ConversationMember>(composingMembers, options)
  }, [composingMembers, t])

  return (
    <Stack height="30px" padding="0 16px" justifyContent="center">
      <Fade in={composingMembers.length !== 0}>
        <Stack
          alignItems="center"
          direction="row"
          spacing="8.5px"
          sx={(theme: any) => ({
            height: theme.typography.caption.lineHeight,
          })}
        >
          <WaitingDots />
          <Typography variant="caption">{text}</Typography>
        </Stack>
      </Fade>
    </Stack>
  )
}

const SingleDot = ({ delay }: { delay: number }) => (
  <Box
    width="8px"
    height="8px"
    borderRadius="100%"
    sx={{ backgroundColor: '#000000' }}
    component={motion.div}
    animate={{ scale: [0.75, 1, 0.75] }}
    transition={{
      delay,
      duration: 0.5,
      repeatDelay: 1,
      repeatType: 'loop',
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
)

const WaitingDots = () => {
  return (
    <Stack direction="row" spacing="5px">
      <SingleDot delay={0} />
      <SingleDot delay={0.5} />
      <SingleDot delay={1} />
    </Stack>
  )
}

const addMessage = (sortedMessages: Message[], message: Message) => {
  if (sortedMessages.length === 0) {
    return [message]
  } else if (message.id === sortedMessages[sortedMessages.length - 1].linearizedParent) {
    return [...sortedMessages, message]
  } else if (message.linearizedParent === sortedMessages[0].id) {
    return [message, ...sortedMessages]
  } else {
    console.error("Can't insert message " + message.id)
    return sortedMessages
  }
}

const sortMessages = (messages: Message[]) => {
  let sortedMessages: Message[] = []
  messages.forEach((message) => (sortedMessages = addMessage(sortedMessages, message)))
  return sortedMessages
}

export default ChatInterface
