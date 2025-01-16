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
import { Box, Chip, Divider, Link, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material'
import { styled, Theme, useTheme } from '@mui/material/styles'
import { darken } from '@mui/system'
import dayjs, { Dayjs } from 'dayjs'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { motion } from 'framer-motion'
import { t } from 'i18next'
import { Message, ReactionAdded, WebSocketMessageType } from 'jami-web-common'
import Linkify from 'linkify-react'
import * as linkify from 'linkifyjs'
import { memo, ReactElement, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useActionMessageContext } from '../contexts/ActionMessageProvider'
import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider'
import { useAuthContext } from '../contexts/AuthProvider'
import { useConversationPreferencesContext } from '../contexts/ConversationPreferencesContext'
import { useConversationContext } from '../contexts/ConversationProvider'
import { useWebSocketContext } from '../contexts/WebSocketProvider'
import { Account } from '../models/account'
import { Contact } from '../models/contact'
import { useDeleteMessageMutation } from '../services/conversationQueries'
import { GetDownloadedFile, useGetAutoDownloadLimit, useGetDownloadFileInfo } from '../services/dataTransferQueries'
import { useLinkPreviewQuery } from '../services/linkPreviewQueries'
import { getMessageCallText, getMessageMemberText } from '../utils/chatmessages'
import { formatRelativeDate, formatTime } from '../utils/dates&times'
import { getSentTimeColor, getTextColor } from '../utils/messagecolor'
import { isEmoji } from '../utils/utils'
import AudioPlayer from './AudioPlayer'
import { EditPictureButton, EmojiButton, MoreButton, ReplyMessageButton } from './Button'
import ConversationAvatar from './ConversationAvatar'
import LoadingPage from './Loading'
import MediaViewer from './MediaViewer'
import MessageDataContent from './MessageDataContent'
import MessageReaction from './MessageReaction'
import MessageStatus from './MessageStatus'
import PopoverList, { PopoverListItemData } from './PopoverList'
import {
  ArrowLeftCurved,
  ArrowLeftDown,
  ArrowRightUp,
  DownloadFileIcon,
  OppositeArrowsIcon,
  TrashBinIcon,
  TwoSheetsIcon,
} from './SvgIcon'
import TransferMessage from './TransferMessage'
import UseLongPress from './UseLongPress'

type MessagePosition = 'start' | 'end'

const notificationMessageTypes = ['initial', 'member'] as const
type NotificationMessageType = (typeof notificationMessageTypes)[number]
const checkIsNotificationMessageType = (type: Message['type'] | undefined): type is NotificationMessageType => {
  return notificationMessageTypes.includes(type as NotificationMessageType)
}

const invisibleMessageTypes = ['application/update-profile', 'merge', 'vote'] as const
type InvisibleMessageType = (typeof invisibleMessageTypes)[number]
const checkIsInvisibleMessageType = (type: Message['type'] | undefined): type is InvisibleMessageType => {
  return invisibleMessageTypes.includes(type as InvisibleMessageType)
}

const userMessageTypes = ['text/plain', 'application/data-transfer+json', 'application/call-history+json'] as const
type UserMessageType = (typeof userMessageTypes)[number]
const checkIsUserMessageType = (type: Message['type'] | undefined): type is UserMessageType => {
  return userMessageTypes.includes(type as UserMessageType)
}

const checkShowsTime = (time: Dayjs, previousTime: Dayjs) => {
  return !previousTime.isSame(time) && !time.isBetween(previousTime, previousTime?.add(1, 'minute'))
}

export const findPreviousVisibleMessage = (messages: Message[], messageIndex: number) => {
  for (let i = messageIndex + 1; i < messages.length; ++i) {
    const message = messages[i]
    if (!checkIsInvisibleMessageType(message?.type)) {
      return message
    }
  }
}

export const findNextVisibleMessage = (messages: Message[], messageIndex: number) => {
  for (let i = messageIndex - 1; i >= 0; --i) {
    const message = messages[i]
    if (!checkIsInvisibleMessageType(message?.type)) {
      return message
    }
  }
}

const avatarSize = '22px'
const spacingBetweenAvatarAndBubble = '10px'
const bubblePadding = '8px'

interface MessageCallProps {
  message: Message
  isAccountMessage: boolean
  isFirstOfGroup: boolean
  isLastOfGroup: boolean
  sentTime: Dayjs
}

const MessageCall = ({ message, isAccountMessage, isFirstOfGroup, isLastOfGroup, sentTime }: MessageCallProps) => {
  const { i18n } = useTranslation()
  const position = isAccountMessage ? 'end' : 'start'
  const theme = useTheme()
  const { conversationColor } = useConversationPreferencesContext()
  const messageColor = isAccountMessage ? conversationColor : theme.ChatInterface.messageColor
  const darkColor = darken(messageColor, 0.3)

  const bubbleColor = isAccountMessage ? darkColor : theme.ChatInterface.messageColor
  //const textColor = isAccountMessage ? getTextColor(darkColor) : '#adaaaa'
  const textColor = '#adaaaa'

  const callDuration = dayjs.duration(parseInt(message?.duration || ''))
  const text = getMessageCallText(isAccountMessage, message, i18n)

  const Icon = callDuration.asSeconds() === 0 ? ArrowLeftCurved : isAccountMessage ? ArrowRightUp : ArrowLeftDown

  const isMissed = text === i18n.t('message_call_outgoing_missed') || text === i18n.t('message_call_incoming_missed')

  return (
    <Bubble
      position={position}
      isFirstOfGroup={isFirstOfGroup}
      isLastOfGroup={isLastOfGroup}
      bubbleColor={bubbleColor}
      sentTime={sentTime}
      edited={false} // edited is not used in call message
      isMedia={false}
      deleted={false} // deleted is not used in call message
    >
      <Stack direction="row" spacing="10px" alignItems="center" paddingLeft="8px">
        <Icon
          sx={{ fontSize: '20px', color: isMissed ? theme.MessageCall.textColorMissed : textColor, marginLeft: '4px' }}
        />
        <Typography
          fontStyle="italic"
          fontWeight={'bolder'}
          variant="body2"
          color={textColor}
          textAlign={'start'}
          sx={{ userSelect: 'none' }}
        >
          {text + '              '}
        </Typography>
      </Stack>
    </Bubble>
  )
}

const MessageInitial = () => {
  const { t } = useTranslation()
  const isReduced = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

  return (
    <Typography maxWidth={isReduced ? '200px' : 'unset'} variant="body1">
      {t('message_swarm_created')}
    </Typography>
  )
}

interface MessageDataTransferProps {
  message: Message
  isAccountMessage: boolean
  isFirstOfGroup: boolean
  isLastOfGroup: boolean
  sentTime: Dayjs
}

enum FileType {
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Document = 'document',
}

const MessageDataTransfer = ({
  isAccountMessage,
  isFirstOfGroup,
  isLastOfGroup,
  message,
  sentTime,
}: MessageDataTransferProps) => {
  const theme: Theme = useTheme()
  const { conversationId, members } = useConversationContext()
  const { setReplyMessage } = useActionMessageContext()
  const { conversationColor } = useConversationPreferencesContext()
  const bubbleColor = isAccountMessage ? conversationColor : theme.ChatInterface.messageColor
  const [fileType, setFileType] = useState<FileType>()
  const extension = message.displayName?.split('.').pop()?.toLowerCase() || ''

  const downloadFile = GetDownloadedFile(conversationId)
  const limitData = useGetAutoDownloadLimit()
  const content = { messageId: message.id, fileId: message.fileId || '' }
  const isFileAlreadyInCache = useGetDownloadFileInfo({ content, conversationId })

  const [isDeleted, setIsDeleted] = useState(false)
  const [preview, setPreview] = useState<string>()
  const [audioBlob, setAudioBlob] = useState<Blob>()
  const [isMediaPreviewOpen, setIsMediaPreviewOpen] = useState(false)

  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const isMedium: boolean = useMediaQuery(theme.breakpoints.only('sm'))

  const textColor = isAccountMessage ? 'white' : 'black'
  const position = isAccountMessage ? 'end' : 'start'
  const totalSize = Number(message.totalSize) / 1000000

  const member = members.find((member) => member.contact.uri === message.author)

  useEffect(() => {
    if (message.fileId === '') {
      setIsDeleted(true)
    }
  }, [message.fileId, setIsDeleted])

  const getAudioBlob = useCallback(async () => {
    const result = await downloadFile.mutateAsync({ messageId: message.id, fileId: message.fileId || '' })
    if (!result.data) {
      return
    }
    const blob = new Blob([result.data], { type: 'audio/' + extension.toLowerCase() })
    setAudioBlob(blob)
  }, [downloadFile, message.id, message.fileId, extension])

  const getPreview = useCallback(
    async (isImage: boolean) => {
      const result = await downloadFile.mutateAsync({ messageId: message.id, fileId: message.fileId || '' })
      if (!result.data) {
        return
      }
      const blob = new Blob([result.data], {
        type: isImage ? 'image/' + extension.toLowerCase() : 'video/' + extension.toLowerCase(),
      })
      setPreview(URL.createObjectURL(blob))
    },
    [downloadFile, message.id, message.fileId, extension],
  )

  useEffect(() => {
    async function checkFileType() {
      if (isDeleted) {
        return
      }
      const acceptedAudioTypes = ['ogg', 'wav', 'mpeg', 'aac', 'flac', 'mp3']
      const acceptedImageTypes = ['apng', 'avif', 'jpg', 'JPG', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff']
      const acceptedVideoTypes = [
        'mp4',
        'webm',
        'mkv',
        'avi',
        'mov',
        'flv',
        'wmv',
        'm4v',
        '3gp',
        '3gpp',
        '3g2',
        '3gpp2',
      ]
      if (acceptedAudioTypes.includes(extension)) {
        setFileType(FileType.Audio)
        if (totalSize < limitData.data.limit || isFileAlreadyInCache.data) {
          await getAudioBlob()
        }
      } else if (acceptedImageTypes.includes(extension)) {
        setFileType(FileType.Image)
        if (totalSize < limitData.data.limit || isFileAlreadyInCache.data) {
          await getPreview(true)
        }
      } else if (acceptedVideoTypes.includes(extension)) {
        setFileType(FileType.Video)
        if (totalSize < limitData.data.limit || isFileAlreadyInCache.data) {
          await getPreview(false)
        }
      } else {
        setFileType(FileType.Document)
      }
    }

    if (limitData.isSuccess && isFileAlreadyInCache.isSuccess && !isDeleted && fileType === undefined) {
      checkFileType()
    }
  }, [
    limitData,
    isFileAlreadyInCache,
    isDeleted,
    fileType,
    extension,
    totalSize,
    setAudioBlob,
    setPreview,
    downloadFile,
    message,
    getAudioBlob,
    getPreview,
  ])

  if (message.fileId === undefined) {
    return null
  }

  const getMaxWidth = () => {
    if (isMobile) {
      return '250px'
    }
    if (isMedium) {
      return '300px'
    }
    return '550px'
  }

  const onDoubleClick = () => {
    if (isDeleted) {
      return
    }
    setReplyMessage(message)
  }

  const onMediaPreview = () => {
    if (!preview || isDeleted || fileType !== FileType.Image) {
      return
    }
    setIsMediaPreviewOpen(true)
  }

  const handleDownload = async () => {
    if (isDeleted) {
      return
    }

    //open download popup
    if (preview) {
      const link = document.createElement('a')
      link.href = preview
      link.setAttribute('href', preview)
      const fileName = message.displayName ? message.displayName : 'file'
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const result = await downloadFile.mutateAsync({ messageId: message.id, fileId: message.fileId || '' })
      if (!result.data) {
        return
      }
      const url = URL.createObjectURL(new Blob([result.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('href', url)
      const fileName = message.displayName ? message.displayName : 'file'
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const dataComponent = () => {
    switch (fileType) {
      case FileType.Audio:
        if (!audioBlob) {
          return (
            <Box
              onClick={() => {
                getAudioBlob()
              }}
            >
              <MessageDataContent
                isAccountMessage={isAccountMessage}
                displayName={message.displayName || 'Unknown'}
                totalSize={Number(message.totalSize)}
                isNotAvailable={true}
              />
            </Box>
          )
        }
        return (
          <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap' }}>
            {position === 'end' && <Box sx={{ minWidth: '35px' }}></Box>}
            <AudioPlayer blob={audioBlob} isAccountMessage={isAccountMessage} />
            {position === 'start' && <Box sx={{ minWidth: '35px' }}></Box>}
          </Box>
        )
      case FileType.Image:
        if (!preview) {
          return (
            <Box
              onClick={() => {
                getPreview(true)
              }}
            >
              <MessageDataContent
                isAccountMessage={isAccountMessage}
                displayName={message.displayName || 'Unknown'}
                totalSize={Number(message.totalSize)}
                isNotAvailable={true}
              />
            </Box>
          )
        }
        return (
          <img
            style={{ maxHeight: '250px', maxWidth: getMaxWidth(), borderRadius: '10px' }}
            src={preview}
            alt={message.displayName}
          />
        )
      case FileType.Video:
        if (!preview) {
          return (
            <Box
              onClick={() => {
                getPreview(false)
              }}
            >
              <MessageDataContent
                isAccountMessage={isAccountMessage}
                displayName={message.displayName || 'Unknown'}
                totalSize={Number(message.totalSize)}
                isNotAvailable={true}
              />
            </Box>
          )
        }
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              alignContent: 'center',
              alignItems: 'center',
            }}
          >
            <video style={{ maxWidth: getMaxWidth(), borderRadius: '10px' }} src={preview} controls />
          </Box>
        )
      default: // includes document
        return (
          <MessageDataContent
            isAccountMessage={isAccountMessage}
            displayName={message.displayName || 'Unknown'}
            totalSize={Number(message.totalSize)}
          />
        )
    }
  }

  return (
    <>
      {preview && (
        <MediaViewer
          blobUrl={preview}
          open={isMediaPreviewOpen}
          onClose={() => setIsMediaPreviewOpen(false)}
          member={member}
          handleDownload={handleDownload}
          fileName={message.displayName}
        />
      )}
      <MessageTooltip
        isDeleted={isDeleted}
        position={position}
        message={message}
        isMedia={true}
        handleDownload={handleDownload}
      >
        <Box
          onClick={onMediaPreview}
          onDoubleClick={onDoubleClick}
          sx={isDeleted || fileType === FileType.Audio ? null : { cursor: 'pointer' }}
        >
          <Bubble
            bubbleColor={bubbleColor}
            position={position}
            isFirstOfGroup={isFirstOfGroup}
            isLastOfGroup={isLastOfGroup}
            sentTime={sentTime}
            edited={false} // edited is not used in data-transfer message
            isMedia={fileType !== FileType.Document ? true : false}
            isAudio={fileType === FileType.Audio}
            deleted={isDeleted}
          >
            {isDeleted ? (
              <Box sx={{ userSelect: 'none' }} color={textColor}>
                {t('media_deleted')}
              </Box>
            ) : (
              dataComponent()
            )}
          </Bubble>
        </Box>
      </MessageTooltip>
      <Box sx={{ width: '95%', display: 'flex', justifyContent: isAccountMessage ? 'flex-start' : 'flex-end' }}>
        <MessageReaction message={message} />
      </Box>
    </>
  )
}

interface MessageMemberProps {
  message: Message
}

const MessageMember = ({ message }: MessageMemberProps) => {
  const { i18n } = useTranslation()
  const theme: Theme = useTheme()
  const isReduced = useMediaQuery(theme.breakpoints.down('md'))

  const text = getMessageMemberText(message, i18n)
  return (
    <Chip
      sx={{
        maxWidth: isReduced ? '300px' : 'unset',
        width: 'fit-content',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
      }}
      label={text}
    />
  )
}

type LinkPreviewProps = {
  isAccountMessage: boolean
  link: string
}

const LinkPreview = ({ isAccountMessage, link }: LinkPreviewProps) => {
  const [imageIsWorking, setImageIsWorking] = useState(true)
  const linkPreviewQuery = useLinkPreviewQuery(link)
  if (linkPreviewQuery.isLoading) {
    return <LoadingPage />
  }
  if (!linkPreviewQuery.isSuccess) {
    return null
  }
  const linkPreview = linkPreviewQuery.data

  return (
    <a href={link} style={{ textDecorationLine: 'none' }}>
      <Stack>
        {imageIsWorking && linkPreview.image && (
          <img
            style={{
              width: '50%',
              borderRadius: '3px',
            }}
            alt={linkPreview.title}
            src={linkPreview.image}
            onError={() => setImageIsWorking(false)}
          />
        )}
        <Typography variant="body1" color={isAccountMessage ? '#cccccc' : 'black'}>
          {linkPreview.title}
        </Typography>
        {linkPreview.description && (
          <Typography variant="body1" sx={{ color: isAccountMessage ? '#ffffff' : '#005699' }}>
            {linkPreview.description}
          </Typography>
        )}
        <Typography variant="body1" color={isAccountMessage ? '#cccccc' : 'black'}>
          {new URL(link).hostname}
        </Typography>
      </Stack>
    </a>
  )
}

type RenderLinkProps = {
  attributes: {
    isAccountMessage: boolean
    href: string
  }
  content: ReactNode
}

const RenderLink = ({ attributes, content }: RenderLinkProps) => {
  const { href, isAccountMessage, ...props } = attributes
  return (
    <Link href={href} {...props} variant="body1" color={isAccountMessage ? '#ffffff' : undefined}>
      {content}
    </Link>
  )
}

interface MessageTextProps {
  message: Message
  isAccountMessage: boolean
  isFirstOfGroup: boolean
  isLastOfGroup: boolean
  sentTime: Dayjs
}

const MessageText = ({ message, isAccountMessage, isFirstOfGroup, isLastOfGroup, sentTime }: MessageTextProps) => {
  const { conversationColor } = useConversationPreferencesContext()
  const theme: Theme = useTheme()

  const position = isAccountMessage ? 'end' : 'start'
  const bubbleColor = isAccountMessage ? conversationColor : theme.ChatInterface.messageColor
  const link = useMemo(() => linkify.find(message?.body ?? '', 'url')[0]?.href, [message])
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const isMedium: boolean = useMediaQuery(theme.breakpoints.only('md'))
  const [isEdited, setIsEdited] = useState(false)
  const { setReplyMessage } = useActionMessageContext()

  const [isDeleted, setIsDeleted] = useState(message.body === '')

  useEffect(() => {
    if (message.body === '') {
      setIsDeleted(true)
    }
  }, [message.body, setIsDeleted])

  useEffect(() => {
    if (message.editions !== undefined && message.editions.length > 0) {
      setIsEdited(true)
    }
  }, [message])

  const onDoubleClick = () => {
    if (isDeleted) {
      return
    }
    setReplyMessage(message)
  }

  if (!isDeleted && message.body.length === 2 && isEmoji(message.body)) {
    return (
      <Box data-cy="message">
        <MessageTooltip isDeleted={isDeleted} position={position} message={message} isMedia={false}>
          <Box sx={{ fontSize: '40px', padding: '4px' }}>{message.body}</Box>
        </MessageTooltip>
        <Box
          sx={{
            width: '95%',
            display: 'flex',
            justifyContent: isAccountMessage ? 'flex-start' : 'flex-end',
            marginTop: '-8px',
          }}
        >
          <MessageReaction message={message} />
        </Box>
      </Box>
    )
  }

  return (
    <>
      <Box data-cy="message">
        <MessageTooltip isDeleted={isDeleted} position={position} message={message} isMedia={false}>
          <Box onDoubleClick={() => onDoubleClick()}>
            <Bubble
              bubbleColor={bubbleColor}
              position={position}
              isFirstOfGroup={isFirstOfGroup}
              isLastOfGroup={isLastOfGroup}
              maxWidth={isMobile ? '200px' : isMedium ? '380px' : '600px'}
              sentTime={sentTime}
              edited={isEdited}
              deleted={isDeleted}
              hasReply={message['reply-to'] !== undefined}
            >
              <Linkify options={{ render: RenderLink as any, attributes: { isAccountMessage } }}>
                {message.body + '            '}
              </Linkify>
              <Box>{link && <LinkPreview isAccountMessage={isAccountMessage} link={link} />}</Box>
            </Bubble>
          </Box>
        </MessageTooltip>
      </Box>
      <Box sx={{ width: '95%', display: 'flex', justifyContent: isAccountMessage ? 'flex-start' : 'flex-end' }}>
        <MessageReaction message={message} />
      </Box>
    </>
  )
}

interface DateIndicatorProps {
  time: Dayjs
}

const DateIndicator = ({ time }: DateIndicatorProps) => {
  const { i18n } = useTranslation()
  const textDate = useMemo(() => formatRelativeDate(time, i18n), [time, i18n])

  return (
    <Box>
      <Divider
        sx={{
          '.MuiDivider-wrapper': {
            margin: 0,
            padding: 0,
          },
          '&::before': {
            borderTop: '1px solid #E5E5E5',
          },
          '&::after': {
            borderTop: '1px solid #E5E5E5',
          },
        }}
      >
        <Typography
          variant="caption"
          fontWeight={700}
          border="1px solid #E5E5E5"
          borderRadius="5px"
          padding="10px 16px"
          textTransform="capitalize"
        >
          {textDate}
        </Typography>
      </Divider>
    </Box>
  )
}

interface TimeIndicatorProps {
  time: Dayjs
  hasDateOnTop: boolean
}

const TimeIndicator = ({ time, hasDateOnTop }: TimeIndicatorProps) => {
  const { i18n } = useTranslation()
  const textTime = useMemo(() => formatTime(time, i18n), [time, i18n])

  return (
    <Stack direction="row" justifyContent="center" marginTop={hasDateOnTop ? '20px' : '30px'}>
      <Typography variant="caption" color="#A7A7A7" fontWeight={700}>
        {textTime}
      </Typography>
    </Stack>
  )
}

interface NotificationMessageRowProps {
  message: Message
}

const NotificationMessageRow = ({ message }: NotificationMessageRowProps) => {
  let messageComponent
  switch (message.type) {
    case 'initial':
      messageComponent = <MessageInitial />
      break
    case 'member':
      messageComponent = <MessageMember message={message} />
      break
    default:
      console.error(`${NotificationMessageRow.name} received unhandled message type: ${message.type}`)
      return null
  }

  return (
    <Stack paddingTop={'30px'} alignItems="center">
      {messageComponent}
    </Stack>
  )
}

interface UserMessageRowProps {
  message: Message
  isAccountMessage: boolean
  previousMessage: Message | undefined
  nextMessage: Message | undefined
  showsTime: boolean
  author: Account | Contact
}

const UserMessageRow = ({
  message,
  previousMessage,
  nextMessage,
  isAccountMessage,
  showsTime,
  author,
}: UserMessageRowProps) => {
  const authorName = author.getDisplayName()
  const position = isAccountMessage ? 'end' : 'start'
  const { t } = useTranslation()
  const previousIsUserMessageType = checkIsUserMessageType(previousMessage?.type)
  const nextIsUserMessageType = checkIsUserMessageType(nextMessage?.type)
  const nextTime = dayjs.unix(Number(nextMessage?.timestamp))
  const sentTime = dayjs.unix(Number(message.timestamp))
  const nextShowsTime = checkShowsTime(nextTime, sentTime)
  const isFirstOfGroup = showsTime || !previousIsUserMessageType || previousMessage?.author !== message.author
  const isLastOfGroup = nextShowsTime || !nextIsUserMessageType || message.author !== nextMessage?.author
  const { members } = useConversationContext()
  const theme: Theme = useTheme()
  const isReduced = useMediaQuery(theme.breakpoints.down('md'))
  const isMobile = useMediaQuery(theme.breakpoints.only('xs'))
  const props = {
    message,
    isAccountMessage,
    isFirstOfGroup,
    isLastOfGroup,
    sentTime,
  }

  let MessageComponent
  switch (message.type) {
    case 'text/plain':
      MessageComponent = MessageText
      break
    case 'application/data-transfer+json':
      MessageComponent = MessageDataTransfer
      break
    case 'application/call-history+json':
      MessageComponent = MessageCall
      break
    default:
      console.error(`${UserMessageRow.name} received unhandled message type: ${message.type}`)
      return null
  }

  const participantNamePadding = isAccountMessage
    ? bubblePadding
    : parseInt(avatarSize) + parseInt(spacingBetweenAvatarAndBubble) + parseInt(bubblePadding) + 'px'

  const replyMessage = message['reply-to']

  function scrollToMessage(messageId: string) {
    const messageElement = document.getElementById(`message-${messageId}`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function highlightReplyMessage(messageId: string) {
    const replyMessageElement = document.getElementById(`message-${messageId}`)
    if (replyMessageElement) {
      replyMessageElement.style.transition = 'background-color 0.5s ease-in-out'
      replyMessageElement.style.backgroundColor = theme.Buttons.hoverBackgroundColor
      setTimeout(() => {
        replyMessageElement.style.backgroundColor = ''
      }, 1000)
    }
  }

  const getMaxReplyWidth = () => {
    if (isMobile) {
      return '300px'
    }
    if (isReduced) {
      return '400px'
    }
    return '600px'
  }

  let replyMessageComponent = <></>

  if (typeof replyMessage !== 'object' && replyMessage !== undefined) {
    console.error('reply-to is not a Message object')
  } else if (replyMessage !== undefined) {
    const member = members.find((member) => replyMessage?.author === member.contact.uri)
    const bubbleColorReply = theme.ChatInterface.messageReplyColor
    const name = member === undefined ? t('yourself') : member.contact.getDisplayName()
    replyMessageComponent = (
      <Box
        sx={{ '&:hover': { cursor: 'pointer' } }}
        onClick={() => {
          scrollToMessage(replyMessage.id)
          highlightReplyMessage(replyMessage.id)
        }}
      >
        <Box sx={{ fontSize: '11px', color: 'grey', fontWeight: 'bolder', mt: 1, mr: 1.5, mb: 0 }}>
          {t('replied_to') + ' ' + name}
        </Box>
        <Box data-cy="reply-message" sx={{ mb: '-16px', mr: 1.5 }}>
          <Bubble
            bubbleColor={bubbleColorReply}
            position={position}
            isFirstOfGroup={true}
            isLastOfGroup={true}
            maxWidth={getMaxReplyWidth()}
            edited={false} // edited is not used in reply message
            deleted={replyMessage.body === ''}
          >
            {replyMessage.type === 'text/plain' ? (
              <Typography variant="body1" color={theme.MessageDataContent.textContentColor} textAlign={position}>
                {replyMessage?.body === '' ? t('message_deleted') : replyMessage?.body}
              </Typography>
            ) : replyMessage.type === 'application/data-transfer+json' ? (
              <MessageDataContent
                isReply={true}
                displayName={replyMessage?.displayName || 'Unknown'}
                totalSize={Number(replyMessage?.totalSize)}
              />
            ) : (
              t('cannot_load_messages')
            )}
          </Bubble>
        </Box>
      </Box>
    )
  }
  return (
    <Stack alignItems={position} id={`message-${message.id}`}>
      {isFirstOfGroup && (
        <Box
          padding={`0px ${participantNamePadding} 0 ${participantNamePadding}`}
          sx={
            isMobile
              ? {
                  maxWidth: isAccountMessage ? 'unset' : '100px',
                  textOverflow: 'ellipsis',
                  textWrap: 'nowrap',
                  marginLeft: !isAccountMessage ? '-8px' : '0',
                }
              : {}
          }
        >
          <ParticipantName name={authorName} />
        </Box>
      )}
      <Box sx={isAccountMessage ? { marginRight: '24px' } : { marginLeft: '48px' }}>{replyMessageComponent}</Box>

      <Stack
        direction="row"
        justifyContent={position}
        alignItems="end"
        spacing={spacingBetweenAvatarAndBubble}
        paddingTop="6px"
        width="66.66%"
        sx={{ zIndex: 2 }}
      >
        <Box sx={{ width: avatarSize }}>
          {!isAccountMessage && isLastOfGroup && (
            <ConversationAvatar
              contactUri={'uri' in author ? author.uri : ''}
              displayName={authorName}
              sx={{ width: avatarSize, height: avatarSize, fontSize: '15px', marginLeft: '4px' }}
            />
          )}
        </Box>
        <motion.div
          initial={message.animate ? { rotate: isAccountMessage ? 5 : -5, scale: 0.8, y: -10 } : undefined}
          animate={message.animate ? { rotate: 0, scale: 1, y: 0 } : undefined}
          transition={
            message.animate
              ? {
                  type: 'spring',
                  stiffness: 300,
                  damping: 10,
                }
              : undefined
          }
        >
          <MessageComponent {...props} />
        </motion.div>
        {isAccountMessage && <MessageStatus message={message} />}
      </Stack>
    </Stack>
  )
}

interface MessageTooltipProps {
  className?: string
  position: MessagePosition
  children: ReactElement
  message: Message
  isDeleted: boolean
  isMedia: boolean
  handleDownload?: () => void
}

const MessageTooltip = styled(
  ({ message, className, position, children, isDeleted, isMedia, handleDownload }: MessageTooltipProps) => {
    const { conversationId } = useConversationContext()
    const webSocket = useWebSocketContext()
    const { account } = useAuthContext()
    const [open, setOpen] = useState(false)
    const [transferModalOpen, setTransferModalOpen] = useState(false)
    const [emojiIsOpen, setEmojiIsOpen] = useState(false)
    const { setReplyMessage } = useActionMessageContext()
    const [tooltipOpen, setTooltipOpen] = useState(false)
    const { setEditMessage } = useActionMessageContext()
    const deleteMessageMutation = useDeleteMessageMutation(conversationId)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.only('xs'))
    const { setAlertContent } = useContext(AlertSnackbarContext)

    const handleLongPress = useCallback(() => {
      if (!isMobile) return
      setTooltipOpen(true)
    }, [isMobile])

    const longPressProps = UseLongPress(handleLongPress, 500)

    useEffect(() => {
      const handleClickOutside = (event: TouchEvent) => {
        const target = event.target as Element | null
        if (target && !target.closest('.MuiTooltip-tooltip')) {
          setTooltipOpen(false)
          onClose()
        }
      }

      document.addEventListener('touchstart', handleClickOutside)
      return () => {
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }, [])

    // No actions if message is deleted
    if (isDeleted) {
      return <>{children}</>
    }

    const handleCopyMessage = () => {
      navigator.clipboard.writeText(message.body)
      setAlertContent({
        messageI18nKey: 'message_content_copied',
        severity: 'success',
        alertOpen: true,
      })
    }

    const handleTransfer = () => {
      setTransferModalOpen(true)
    }

    const handleTransferClose = () => {
      setTransferModalOpen(false)
    }

    const additionalOptions: PopoverListItemData[] = [
      {
        Icon: OppositeArrowsIcon,
        label: 'Transfer',
        onClick: handleTransfer,
      },
    ]

    if (isMedia) {
      additionalOptions.push({
        Icon: DownloadFileIcon,
        label: 'Download',
        onClick: () => {
          if (handleDownload) {
            handleDownload()
          }
        },
      })
    } else {
      additionalOptions.push({
        Icon: TwoSheetsIcon,
        label: 'Copy',
        onClick: handleCopyMessage,
      })
    }

    if (account.getUri() === message.author) {
      additionalOptions.push({
        Icon: TrashBinIcon,
        label: 'Delete message',
        onClick: () => {
          deleteMessageMutation.mutate(message.id)
        },
      })
    }

    const toggleMoreMenu = () => setOpen((open) => !open)
    const onClose = () => {
      setOpen(false)
      setEmojiIsOpen(false)
    }

    const onEmojiClickHandler = () => {
      setEmojiIsOpen(true)
    }

    function onReply() {
      setEditMessage(undefined)
      setReplyMessage(message)
    }

    function onEdit() {
      setReplyMessage(undefined)
      setEditMessage(message)
    }

    function onEmojiSelected(emoji: string) {
      for (const reaction of message.reactions) {
        if (reaction.author === account.getUri() && reaction.body === emoji) {
          if (reaction.id === undefined) {
            console.error('reaction id is undefined')
          } else {
            webSocket.send(WebSocketMessageType.ReactionRemoved, {
              conversationId,
              messageId: message.id,
              reactionId: reaction.id,
            })
          }
          return
        }
      }
      const data: ReactionAdded = {
        accountId: account.id,
        conversationId: conversationId,
        messageId: message.id,
        reaction: {
          author: account.id,
          body: emoji,
          timestamp: dayjs().unix().toString(),
          parents: message.id,
          'react-to': message.id,
        },
      }
      webSocket.send(WebSocketMessageType.ReactionAdded, data)
    }
    const onEmojiClick = (emoji: EmojiClickData, _: MouseEvent) => {
      onEmojiSelected(emoji.emoji)
      setEmojiIsOpen(false)
      handleMouseLeave()
    }
    const handleMouseEnter = () => {
      if (isMobile) return
      setTooltipOpen(true)
    }
    const handleMouseLeave = () => {
      setTooltipOpen(false)
      onClose()
    }
    return (
      <>
        <Tooltip
          classes={{ tooltip: className }}
          placement={position === 'start' ? 'right-start' : 'left-start'}
          PopperProps={{
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [-2, -18],
                },
              },
            ],
          }}
          open={tooltipOpen}
          disableHoverListener
          disableFocusListener
          disableTouchListener={!isMobile}
          title={
            <div onMouseLeave={handleMouseLeave} onMouseEnter={handleMouseEnter}>
              <Stack direction="row" spacing="16px" padding="16px" sx={{ cursor: 'pointer' }}>
                <EmojiButton data-cy="emoji-reaction-button" emoji="😃" onClick={onEmojiClickHandler} />
                <ReplyMessageButton data-cy="reply-button" onClick={onReply} />
                {account.getUri() === message.author && (
                  <EditPictureButton
                    data-cy="edit-button"
                    onClick={onEdit}
                    sx={{ minHeight: '20px', minWidth: '20px' }}
                  />
                )}
                <MoreButton onClick={toggleMoreMenu} />
              </Stack>
              {open && (
                <>
                  <Divider sx={{ marginX: '16px' }} />
                  <PopoverList items={additionalOptions} />
                </>
              )}
              {emojiIsOpen && (
                <EmojiPicker
                  theme={theme.EmojiPicker.backgroundColor}
                  onEmojiClick={onEmojiClick}
                  autoFocusSearch={false}
                  skinTonesDisabled={true}
                />
              )}
            </div>
          }
        >
          <div {...longPressProps} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {children}
          </div>
        </Tooltip>
        <TransferMessage
          conversationId={conversationId}
          message={message}
          onClose={handleTransferClose}
          open={transferModalOpen}
        />
      </>
    )
  },
)(({ position, theme }) => {
  const largeRadius = '20px'
  const smallRadius = '5px'
  return {
    backgroundColor: theme.InfoTooltip.backgroundColor.main,
    color: theme.InfoTooltip.color.main,
    padding: '0px',
    boxShadow: '3px 3px 7px #00000029',
    borderRadius: largeRadius,
    borderStartStartRadius: position === 'start' ? smallRadius : largeRadius,
    borderStartEndRadius: position === 'end' ? smallRadius : largeRadius,
    overflow: 'hidden',
  }
})

interface BubbleProps {
  position: MessagePosition
  isFirstOfGroup: boolean
  isLastOfGroup: boolean
  bubbleColor: string
  maxWidth?: string
  children: ReactNode
  sentTime?: Dayjs
  edited: boolean
  deleted: boolean
  isMedia?: boolean
  isAudio?: boolean
  hasReply?: boolean
}

const Bubble = ({
  position,
  isFirstOfGroup,
  isLastOfGroup,
  bubbleColor,
  maxWidth,
  children,
  sentTime,
  edited,
  deleted,
  isMedia,
  isAudio,
  hasReply,
}: BubbleProps) => {
  const { t } = useTranslation()
  const largeRadius = '12px'
  const smallRadius = '5px'
  const theme = useTheme()
  const radius = useMemo(() => {
    if (position === 'start') {
      return {
        borderStartStartRadius: isFirstOfGroup ? largeRadius : smallRadius,
        borderStartEndRadius: largeRadius,
        borderEndStartRadius: isLastOfGroup ? largeRadius : smallRadius,
        borderEndEndRadius: largeRadius,
      }
    }
    return {
      borderStartStartRadius: largeRadius,
      borderStartEndRadius: isFirstOfGroup ? largeRadius : smallRadius,
      borderEndStartRadius: largeRadius,
      borderEndEndRadius: isLastOfGroup ? largeRadius : smallRadius,
    }
  }, [isFirstOfGroup, isLastOfGroup, position])
  const nonMediaBubbleStyle = {
    border: hasReply ? theme.ChatInterface.replyBorderColor : 'unset',
    color: position === 'start' ? theme.ChatInterface.fontColor : getTextColor(bubbleColor),
    maxWidth: maxWidth || '100%',
    backgroundColor: bubbleColor,
    padding: isMedia && !deleted ? null : bubblePadding,
    overflow: 'hidden',
    wordWrap: 'break-word',
    textWrap: 'wrap',
    display: 'flex',
    flexWrap: 'wrap',
    whiteSpace: 'pre-wrap',
    marginRight: '8px',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    height: 'auto',
    ...radius,
  }
  const mediaBubbleStyle = {
    paddingTop: '15px',
    marginRight: isAudio && position === 'start' ? '-25px' : '8px',
  }
  const messageContentBubbleStyle = {
    wordWrap: 'break-word',
  }
  const sentTimeStyle = {
    userSelect: 'none',
    color: getSentTimeColor(bubbleColor),
    fontSize: 11,
    flexWrap: 'nowrap',
    textWrap: 'nowrap',
    whiteSpace: 'nowrap',
  }
  const boxedBubbleSentTime = {
    zIndex: 3,
    marginRight: '16px',
    marginTop: '-24px',
  }
  const editedBoxedBubbleSentTime = {
    ...boxedBubbleSentTime,
    marginRight: position === 'start' ? '20px' : '16px',
  }

  const deletedMessageStyle = {
    color: '#adaaaa',
    fontStyle: 'italic',
    backgroundColor: darken(bubbleColor, 0.5),
  }

  const messageStyles = deleted
    ? { ...nonMediaBubbleStyle, ...deletedMessageStyle }
    : isMedia
      ? mediaBubbleStyle
      : nonMediaBubbleStyle

  return (
    <Box>
      <Box sx={messageStyles}>
        <Box
          sx={
            isMedia && !deleted
              ? { userSelect: deleted ? 'none' : 'auto' }
              : { ...messageContentBubbleStyle, userSelect: deleted ? 'none' : 'auto' }
          }
        >
          {deleted ? t(isMedia ? 'media_deleted' : 'message_deleted') + '            ' : children}
        </Box>
      </Box>
      {edited && !deleted ? (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', ...sentTimeStyle }}>
          <Box sx={{ marginLeft: '8px' }}>
            <div data-cy={`message-edited`}>{t('edited')}</div>
          </Box>
          <Box sx={editedBoxedBubbleSentTime}>
            {sentTime && <div data-cy={`message-sent-time`}>{sentTime.format('h:mm a')}</div>}
          </Box>
        </Box>
      ) : (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', ...sentTimeStyle }}>
          <Box sx={boxedBubbleSentTime}>
            {sentTime && <div data-cy={`message-sent-time`}>{sentTime.format('h:mm a')}</div>}
          </Box>
        </Box>
      )}
    </Box>
  )
}

interface ParticipantNameProps {
  name: string
}

const ParticipantName = ({ name }: ParticipantNameProps) => {
  return (
    <Typography variant="caption" color="#A7A7A7" fontWeight={700}>
      {name}
    </Typography>
  )
}

interface MessageProps {
  message: Message
  isAccountMessage: boolean
  author: Account | Contact
  previousMessage?: Message | undefined
  nextMessage?: Message | undefined
}

export const MessageRow = memo(({ message, isAccountMessage, author, previousMessage, nextMessage }: MessageProps) => {
  const time = dayjs.unix(Number(message.timestamp))
  const previousTime = dayjs.unix(Number(previousMessage?.timestamp))
  const showDate =
    message?.type === 'initial' || previousTime.year() !== time.year() || previousTime.dayOfYear() !== time.dayOfYear()
  const showTime = checkShowsTime(time, previousTime)

  let messageComponent
  if (checkIsUserMessageType(message.type)) {
    messageComponent = (
      <UserMessageRow
        message={message}
        previousMessage={previousMessage}
        nextMessage={nextMessage}
        showsTime={showTime}
        isAccountMessage={isAccountMessage}
        author={author}
      />
    )
  } else if (checkIsNotificationMessageType(message.type)) {
    messageComponent = <NotificationMessageRow message={message} />
  } else if (checkIsInvisibleMessageType(message.type)) {
    return null
  } else {
    const _exhaustiveCheck: never = message.type
    return _exhaustiveCheck
  }

  return (
    <Stack zIndex={2}>
      {showDate && (
        <Box sx={{ mt: '15px', mb: '15px' }}>
          <DateIndicator time={time} />
        </Box>
      )}
      {showTime && (
        <Box sx={{ mt: '15px', mb: '15px' }}>
          <TimeIndicator time={time} hasDateOnTop={showDate} />
        </Box>
      )}
      {messageComponent}
    </Stack>
  )
})
