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
import { Box, Button, Divider, Fade, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import {
  AccountMessageStatus,
  ConversationMessage,
  LoadMoreMessages,
  Message,
  ReactionAdded,
  ReactionRemoved,
  WebSocketMessageType,
} from 'jami-web-common'
import { MessageStatusCode } from 'jami-web-common/src/enums/message-status-code'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'

import { FilePreviewRemovable } from '../components/FilePreview'
import LoadingPage from '../components/Loading'
import MessageList from '../components/MessageList'
import { FileDragOverlay } from '../components/Overlay'
import ReplyToMessage from '../components/ReplyToMessage'
import SendMessageForm from '../components/SendMessageForm'
import { PenIcon } from '../components/SvgIcon'
import { useActionMessageContext } from '../contexts/ActionMessageProvider'
import { useAuthContext } from '../contexts/AuthProvider'
import { useConversationContext } from '../contexts/ConversationProvider'
import { useWebSocketContext } from '../contexts/WebSocketProvider'
import { ConversationMember } from '../models/conversation-member'
import { useEditMessageMutation, useMessagesQuery, useSendMessageMutation } from '../services/conversationQueries'
import { useSendFilesMutation } from '../services/dataTransferQueries'
import { FileHandler } from '../utils/files'
import { translateEnumeration, TranslateEnumerationOptions } from '../utils/translations'

export const currentLastSeenMessageContext = createContext<Map<string, string>>(new Map())

const ChatInterface = () => {
  const webSocket = useWebSocketContext()
  const { conversationId, members } = useConversationContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const { t } = useTranslation()
  const {
    replyMessage: selectedReply,
    setReplyMessage: setSelectedReply,
    editMessage,
    setEditMessage: setIsEditing,
  } = useActionMessageContext()
  const messagesQuery = useMessagesQuery(conversationId)
  const sendMessageMutation = useSendMessageMutation(conversationId)
  const editMessageMutation = useEditMessageMutation(conversationId)
  const sendFilesMutation = useSendFilesMutation(conversationId)

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

  function linkMessagetoReply(messages: Message[]) {
    const messageMap = new Map(messages.map((message) => [message.id, message]))
    messages.forEach((message) => {
      if (message['reply-to']) {
        message['reply-to'] = messageMap.get(message['reply-to'] as string)
      }
    })
  }

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
      linkMessagetoReply(sortedMessages)
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
    (message: string) => {
      sendMessageMutation.mutate(JSON.stringify({ message, replyTo: selectedReply?.id }))
      const data: FormData = new FormData()
      for (const file of fileHandlers) {
        data.append('file', file.file)
      }
      data.append('replyTo', selectedReply?.id || '')
      sendFilesMutation.mutate(data)
      setFileHandlers([])
    },
    [sendMessageMutation, selectedReply, fileHandlers, sendFilesMutation],
  )

  const editMessageHandler = useCallback(
    (message: string) => {
      editMessageMutation.mutate(JSON.stringify({ message, messageId: editMessage?.id }))
    },
    [editMessage, editMessageMutation],
  )

  function onCancelEdit() {
    setIsEditing(undefined)
  }

  function handleSendMessage(message: string, audioFile?: File) {
    if (message === 'files-to-send') {
      const data: FormData = new FormData()
      for (const file of fileHandlers) {
        data.append('file', file.file)
      }
      data.append('replyTo', selectedReply?.id || '')
      sendFilesMutation.mutate(data)
      setFileHandlers([])
    } else if (message === 'audio-message') {
      if (audioFile) {
        const data: FormData = new FormData()
        data.append('file', audioFile)
        data.append('replyTo', selectedReply?.id || '')
        sendFilesMutation.mutate(data)
      }
    } else {
      if (editMessage) editMessageHandler(message)
      else sendMessage(message)
      setIsEditing(undefined)
    }
    setSelectedReply(undefined)
  }

  useEffect(() => {
    const conversationMessageListener = (data: ConversationMessage) => {
      if (data.message['reply-to']) {
        for (const reply of messages) {
          if (reply.id === data.message['reply-to']) {
            data.message['reply-to'] = reply
            break
          }
        }
      }
      setMessages((messages) => addMessage(messages, data.message))
    }
    const reactionsAddedListener = (data: ReactionAdded) => {
      setMessages((messages) => {
        return messages.map((message) => {
          if (message.id === data.messageId) {
            const updatedReactions = message.reactions ? [...message.reactions, data.reaction] : [data.reaction]
            return { ...message, reactions: updatedReactions }
          }
          return message
        })
      })
    }
    const reactionsRemovedListener = (data: ReactionRemoved) => {
      setMessages((messages) => {
        const index = messages.findIndex((message) => message.id === data.messageId)
        if (index !== -1) {
          const updatedMessages = [...messages]
          const message = updatedMessages[index]
          if (message.reactions === undefined) {
            console.log('No reactions to remove')
          } else {
            message.reactions = message.reactions.filter((reaction) => reaction.id !== data.reactionId)
          }
          return updatedMessages
        }
        return messages
      })
    }
    const messageEditionListener = (data: ConversationMessage) => {
      setMessages((messages) => {
        const index = messages.findIndex((message) => message.id === data.message.id)
        if (index !== -1) {
          const updatedMessages = [...messages]
          // replace the previous message with the new one
          updatedMessages[index] = data.message
          const messageMap = new Map(updatedMessages.map((message) => [message.id, message]))
          updatedMessages.forEach((message) => {
            if (message['reply-to'] && typeof message['reply-to'] === 'object' && 'id' in message['reply-to']) {
              const replyToMessage = messageMap.get(message['reply-to'].id)
              if (replyToMessage) {
                message['reply-to'] = replyToMessage
              }
            }
          })
          return updatedMessages
        }
        return messages
      })
    }

    const loadMoreMessagesListener = (data: LoadMoreMessages) => {
      setMessages((messages) => {
        const newMessages = data.messages
        if (newMessages) {
          // add messages above the current ones
          return [...messages, ...newMessages]
        }
        return messages
      })
    }

    webSocket.bind(WebSocketMessageType.LoadMoreMessages, loadMoreMessagesListener)
    webSocket.bind(WebSocketMessageType.MessageEdition, messageEditionListener)
    webSocket.bind(WebSocketMessageType.ReactionAdded, reactionsAddedListener)
    webSocket.bind(WebSocketMessageType.ReactionRemoved, reactionsRemovedListener)
    webSocket.bind(WebSocketMessageType.ConversationMessage, conversationMessageListener)
    return () => {
      webSocket.unbind(WebSocketMessageType.LoadMoreMessages, loadMoreMessagesListener)
      webSocket.unbind(WebSocketMessageType.MessageEdition, messageEditionListener)
      webSocket.unbind(WebSocketMessageType.ReactionAdded, reactionsAddedListener)
      webSocket.unbind(WebSocketMessageType.ReactionRemoved, reactionsRemovedListener)
      webSocket.unbind(WebSocketMessageType.ConversationMessage, conversationMessageListener)
    }
  }, [messages, webSocket])

  if (isLoading) {
    return <LoadingPage />
  } else if (error) {
    return <div>Error loading {conversationId}</div>
  }

  return (
    <Stack flex={1} overflow="hidden" {...getRootProps()} paddingBottom="16px">
      {isDragActive && <FileDragOverlay />}
      <input {...getInputProps()} />
      <currentLastSeenMessageContext.Provider value={lastSeen}>
        <MessageList messages={messages} />
      </currentLastSeenMessageContext.Provider>
      <ComposingMembersIndicator />
      <Divider
        sx={{
          marginX: '16px',
          borderTop: '1px solid #E5E5E5',
        }}
      />
      <ReplyToMessage />
      {editMessage !== undefined ? (
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', padding: '1%' }}>
            <PenIcon sx={{ marginLeft: '2%' }} />
            <Box sx={{ marginLeft: '10%' }}>{t('editing')}</Box>
          </Box>
          <Button onClick={onCancelEdit} sx={{ marginLeft: '4%' }}>
            X
          </Button>
        </Box>
      ) : null}
      <SendMessageForm
        onSend={handleSendMessage}
        openFilePicker={openFilePicker}
        fileHandlers={fileHandlers}
        editMessage={editMessage}
      />
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
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
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
