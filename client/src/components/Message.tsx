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
// eslint-disable-next-line simple-import-sort/imports
import { Box, Chip, Divider, Link, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material'
import { styled } from '@mui/material/styles'
import { Theme, useTheme } from '@mui/material/styles'
import dayjs, { Dayjs } from 'dayjs'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { Message, ReactionAdded, WebSocketMessageType } from 'jami-web-common'
import Linkify from 'linkify-react'
import * as linkify from 'linkifyjs'
import { memo, ReactElement, ReactNode, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuthContext } from '../contexts/AuthProvider'
import { useConversationContext } from '../contexts/ConversationProvider'
import { useReplyMessageContext } from '../contexts/ReplyMessageProvider'
import { useWebSocketContext } from '../contexts/WebSocketProvider'
import { Account } from '../models/account'
import { Contact } from '../models/contact'
import { useLinkPreviewQuery } from '../services/linkPreviewQueries'
import { getMessageCallText, getMessageMemberText } from '../utils/chatmessages'
import { formatRelativeDate, formatTime } from '../utils/dates&times'
import { EmojiButton, MoreButton, ReplyMessageButton } from './Button'
import ConversationAvatar from './ConversationAvatar'
import LoadingPage from './Loading'
import MessageReaction from './MessageReaction'
import MessageStatus from './MessageStatus'
import PopoverList, { PopoverListItemData } from './PopoverList'
import {
  ArrowLeftCurved,
  ArrowLeftDown,
  ArrowRightUp,
  OppositeArrowsIcon,
  TrashBinIcon,
  TwoSheetsIcon,
} from './SvgIcon'
import { getColor, getTextColor, getSentTimeColor } from '../utils/messagecolor'

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
const bubblePadding = '10px'

interface MessageCallProps {
  message: Message
  isAccountMessage: boolean
  isFirstOfGroup: boolean
  isLastOfGroup: boolean
  sentTime: Dayjs
}

const MessageCall = ({ message, isAccountMessage, isFirstOfGroup, isLastOfGroup, sentTime }: MessageCallProps) => {
  const position = isAccountMessage ? 'end' : 'start'

  const { i18n } = useTranslation()
  const { bubbleColor, Icon, text, textColor } = useMemo(() => {
    const text = getMessageCallText(isAccountMessage, message, i18n)
    const callDuration = dayjs.duration(parseInt(message?.duration || ''))
    if (callDuration.asSeconds() === 0) {
      if (isAccountMessage) {
        return {
          text,
          Icon: ArrowLeftCurved,
          textColor: 'white',
          bubbleColor: '#005699' + '80', // opacity 50%
        }
      } else {
        return {
          text,
          Icon: ArrowLeftCurved,
          textColor: 'black',
          bubbleColor: '#C6C6C6',
        }
      }
    } else {
      if (isAccountMessage) {
        return {
          text,
          Icon: ArrowRightUp,
          textColor: 'white',
          bubbleColor: '#005699',
        }
      } else {
        return {
          text,
          Icon: ArrowLeftDown,
          textcolor: 'black',
          bubbleColor: '#E5E5E5',
        }
      }
    }
  }, [isAccountMessage, message, i18n])

  return (
    <Bubble
      position={position}
      isFirstOfGroup={isFirstOfGroup}
      isLastOfGroup={isLastOfGroup}
      bubbleColor={bubbleColor}
      sentTime={sentTime}
    >
      <Stack direction="row" spacing="10px" alignItems="center">
        <Icon sx={{ fontSize: '16px', color: textColor }} />
        <Typography variant="body1" color={textColor} textAlign={'start'} fontWeight="bold" textTransform="uppercase">
          {text}
        </Typography>
      </Stack>
    </Bubble>
  )
}

const MessageInitial = () => {
  const { t } = useTranslation()
  return <Typography variant="body1">{t('message_swarm_created')}</Typography>
}

interface MessageDataTransferProps {
  message: Message
  isAccountMessage: boolean
  isFirstOfGroup: boolean
  isLastOfGroup: boolean
  sentTime: Dayjs
}

const MessageDataTransfer = ({
  //message, not used for now but will be used in the future
  isAccountMessage,
  isFirstOfGroup,
  isLastOfGroup,
  sentTime,
}: MessageDataTransferProps) => {
  const position = isAccountMessage ? 'end' : 'start'
  return (
    <Bubble
      bubbleColor="#E5E5E5"
      position={position}
      isFirstOfGroup={isFirstOfGroup}
      isLastOfGroup={isLastOfGroup}
      sentTime={sentTime}
    >
      &quot;data-transfer&quot;
    </Bubble>
  )
}

interface MessageMemberProps {
  message: Message
}

const MessageMember = ({ message }: MessageMemberProps) => {
  const { i18n } = useTranslation()

  const text = getMessageMemberText(message, i18n)
  return (
    <Chip
      sx={{
        width: 'fit-content',
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
              padding: '15px 0',
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
  const { members } = useConversationContext()

  const position = isAccountMessage ? 'end' : 'start'
  const bubbleColor = isAccountMessage ? (members.length > 1 ? '#9E9E9E' : getColor(members[0].contact.uri)) : '#E5E5E5'
  const textColor = isAccountMessage ? getTextColor(bubbleColor) : '#000000'
  const link = useMemo(() => linkify.find(message?.body ?? '', 'url')[0]?.href, [message])
  const theme: Theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const isMedium: boolean = useMediaQuery(theme.breakpoints.only('md'))
  const { setMessage: setReplyMessage } = useReplyMessageContext()

  const onDoubleClick = () => {
    setReplyMessage(message)
  }

  return (
    <Box>
      <MessageTooltip position={position} message={message}>
        <Box onDoubleClick={() => onDoubleClick()}>
          <Bubble
            bubbleColor={bubbleColor}
            position={position}
            isFirstOfGroup={isFirstOfGroup}
            isLastOfGroup={isLastOfGroup}
            maxWidth={isMobile ? '200px' : isMedium ? '380px' : '600px'}
            sentTime={sentTime}
          >
            <Typography variant="body1" color={textColor} textAlign={position}>
              <Linkify options={{ render: RenderLink as any, attributes: { isAccountMessage } }}>
                {message.body}
              </Linkify>
            </Typography>
            {link && <LinkPreview isAccountMessage={isAccountMessage} link={link} />}
          </Bubble>
        </Box>
      </MessageTooltip>
    </Box>
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

  let replyMessageComponent = <></>

  if (typeof replyMessage !== 'object' && replyMessage !== undefined) {
    console.error('reply-to is not a Message object')
  } else if (replyMessage !== undefined) {
    const member = members.find((member) => replyMessage?.author === member.contact.uri)
    const bubbleColorReply = '#D3D3D3'
    const textColorReply = '#555555'
    const name = member === undefined ? t('yourself') : member.contact.getDisplayName()
    replyMessageComponent = (
      <>
        <Box sx={{ fontSize: '11px', color: 'grey', fontWeight: 'bolder', mt: 1, mr: 1.5, mb: 0 }}>
          {t('replied_to') + ' ' + name}
        </Box>
        <Box sx={{ mb: -2, mr: 1.5 }}>
          <Bubble
            bubbleColor={bubbleColorReply}
            position={position}
            isFirstOfGroup={true}
            isLastOfGroup={true}
            maxWidth={'400px'}
          >
            <Typography variant="body1" color={textColorReply} textAlign={position}>
              {replyMessage?.body}
            </Typography>
          </Bubble>
        </Box>
      </>
    )
  }

  return (
    <Stack alignItems={position}>
      {isFirstOfGroup && (
        <Box padding={`0px ${participantNamePadding} 0 ${participantNamePadding}`}>
          <ParticipantName name={authorName} />
        </Box>
      )}
      {replyMessageComponent}
      <Stack
        direction="row"
        justifyContent={position}
        alignItems="end"
        spacing={spacingBetweenAvatarAndBubble}
        paddingTop="6px"
        width="66.66%"
        sx={{ zIndex: 1 }}
      >
        <Box sx={{ width: avatarSize }}>
          {!isAccountMessage && isLastOfGroup && (
            <ConversationAvatar
              displayName={authorName}
              sx={{ width: avatarSize, height: avatarSize, fontSize: '15px' }}
            />
          )}
        </Box>
        <MessageComponent {...props} />
        <MessageStatus message={message} />
      </Stack>
      <MessageReaction message={message} />
    </Stack>
  )
}

interface MessageTooltipProps {
  className?: string
  position: MessagePosition
  children: ReactElement
  message: Message
}

const MessageTooltip = styled(({ message, className, position, children }: MessageTooltipProps) => {
  const { conversationId } = useConversationContext()
  const webSocket = useWebSocketContext()
  const { account } = useAuthContext()
  const [open, setOpen] = useState(false)
  const [emojiIsOpen, setEmojiIsOpen] = useState(false)
  const { setMessage: setReplyMessage } = useReplyMessageContext()
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const additionalOptions: PopoverListItemData[] = [
    {
      Icon: TwoSheetsIcon,
      label: 'Copy',
      onClick: () => {},
    },
    {
      Icon: OppositeArrowsIcon,
      label: 'Transfer',
      onClick: () => {},
    },
    {
      Icon: TrashBinIcon,
      label: 'Delete message',
      onClick: () => {},
    },
  ]

  const toggleMoreMenu = useCallback(() => setOpen((open) => !open), [setOpen])

  const onClose = () => {
    setOpen(false)
    setEmojiIsOpen(false)
  }

  const onEmojiClickHandler = () => {
    setEmojiIsOpen(true)
  }

  function onReply() {
    setReplyMessage(message)
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
  }

  const handleMouseEnter = () => {
    setTooltipOpen(true)
  }

  const handleMouseLeave = () => {
    setTooltipOpen(false)
    onClose()
  }

  return (
    <Tooltip
      classes={{ tooltip: className }}
      placement={position === 'start' ? 'right-start' : 'left-start'}
      PopperProps={{
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [-2, -50],
            },
          },
        ],
      }}
      open={tooltipOpen}
      disableHoverListener
      disableFocusListener
      disableTouchListener
      title={
        <div onMouseLeave={handleMouseLeave}>
          <Stack direction="row" spacing="16px" padding="16px" sx={{ cursor: 'pointer' }}>
            <EmojiButton emoji="😃" onClick={onEmojiClickHandler} />
            <ReplyMessageButton onClick={onReply} />
            <MoreButton onClick={toggleMoreMenu} />
          </Stack>
          {open && (
            <>
              <Divider sx={{ marginX: '16px' }} />
              <PopoverList items={additionalOptions} />
            </>
          )}
          {emojiIsOpen && <EmojiPicker onEmojiClick={onEmojiClick} autoFocusSearch={false} skinTonesDisabled={true} />}
        </div>
      }
    >
      <div onMouseEnter={handleMouseEnter}>{children}</div>
    </Tooltip>
  )
})(({ position }) => {
  const largeRadius = '20px'
  const smallRadius = '5px'
  return {
    backgroundColor: 'white',
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
}

const Bubble = ({
  position,
  isFirstOfGroup,
  isLastOfGroup,
  bubbleColor,
  maxWidth,
  children,
  sentTime,
}: BubbleProps) => {
  const largeRadius = '12px'
  const smallRadius = '5px'
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

  // text color
  // date color

  return (
    <Box
      sx={{
        color: getTextColor(bubbleColor),
        display: 'flex',
        flexDirection: 'row',
        width: 'fit-content',
        maxWidth,
        backgroundColor: bubbleColor,
        padding: bubblePadding,
        overflow: 'hidden',
        wordWrap: 'break-word',
        ...radius,
      }}
    >
      {children}
      <Box
        sx={{
          marginBottom: '-2px',
          paddingLeft: '10px',
          whiteSpace: 'nowrap',
          marginTop: 'auto',
          marginLeft: '-6%',
        }}
      >
        {sentTime && (
          <Box
            sx={{
              width: 1,
              color: getSentTimeColor(bubbleColor),
              fontSize: 11,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              flexWrap: 'nowrap',
              ml: '10%',
            }}
          >
            <div data-cy={`message-sent-time`}>{sentTime.format('h:mm a')}</div>
          </Box>
        )}
      </Box>
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
    <Stack>
      {showDate && <DateIndicator time={time} />}
      {showTime && <TimeIndicator time={time} hasDateOnTop={showDate} />}
      {messageComponent}
    </Stack>
  )
})
