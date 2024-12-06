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
import { Box, List, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import dayjs from 'dayjs'
import { IConversationSummary } from 'jami-web-common'
import { MessageStatusCode } from 'jami-web-common/src/enums/message-status-code'
import { QRCodeCanvas } from 'qrcode.react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAuthContext } from '../contexts/AuthProvider'
import { useCallManagerContext } from '../contexts/CallManagerProvider'
import { useConversationDisplayNameShort } from '../hooks/useConversationDisplayName'
import { useUrlParams } from '../hooks/useUrlParams'
import { ConversationRouteParams } from '../router'
import { CallStatus } from '../services/CallManager'
import { useRefreshConversationsSummaries } from '../services/conversationQueries'
import { useMembersQuery } from '../services/conversationQueries'
import { getMessageCallText, getMessageMemberText } from '../utils/chatmessages'
import { formatRelativeDate, formatTime } from '../utils/dates&times'
import { getColor } from '../utils/messagecolor'
import ContextMenu, { ContextMenuHandler, useContextMenuHandler } from './ContextMenu'
import ConversationAvatar from './ConversationAvatar'
import { CustomListItemButton } from './CustomListItemButton'
import { DialogContentList, InfosDialog, useDialogHandler } from './Dialog'
import { PopoverListItemData } from './PopoverList'
import RemoveConversationDialog from './RemoveComversationDialog'
import { CancelIcon, MessageIcon, PersonIcon } from './SvgIcon'

type ConversationSummaryListProps = {
  conversationsSummaries: IConversationSummary[]
}

export const ConversationSummaryList = ({ conversationsSummaries }: ConversationSummaryListProps) => {
  const sortedConversations = useMemo(() => {
    if (conversationsSummaries.some((conversationSummary) => conversationSummary === null)) {
      return conversationsSummaries
    }
    return [...conversationsSummaries].sort((a, b) => Number(b.lastMessage.timestamp) - Number(a.lastMessage.timestamp))
  }, [conversationsSummaries])

  return (
    <List
      sx={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {sortedConversations?.map(
        (conversationSummary) =>
          conversationSummary !== null && (
            <ConversationSummaryListItem key={conversationSummary.id} conversationSummary={conversationSummary} />
          ),
      )}
    </List>
  )
}
type ConversationSummaryListItemProps = {
  conversationSummary: IConversationSummary
}

const ConversationSummaryListItem = ({ conversationSummary }: ConversationSummaryListItemProps) => {
  const { account } = useAuthContext()
  const {
    urlParams: { conversationId: selectedConversationId },
  } = useUrlParams<ConversationRouteParams>()
  const contextMenuHandler = useContextMenuHandler()
  const navigate = useNavigate()
  const members = useMembersQuery(conversationSummary.id)
  const memberArray = members.data

  const filteredMembers = useMemo(() => {
    return memberArray?.filter((member) => member.contact.uri !== account.getUri()) || []
  }, [memberArray, account])

  console.log('filteredMembers', filteredMembers)

  const conversationId = conversationSummary.id
  const isSelected = conversationId === selectedConversationId
  const refreshConversationsSummaries = useRefreshConversationsSummaries()
  const onClick = useCallback(() => {
    refreshConversationsSummaries()
    if (conversationId) {
      navigate(`/conversation/${conversationId}`)
    }
  }, [conversationId, navigate, refreshConversationsSummaries])

  const conversationName = useConversationDisplayNameShort(
    account,
    conversationSummary.title,
    conversationSummary.membersNames,
  )

  return (
    <Box>
      <ConversationMenu
        conversationMemberUri={
          Number(conversationSummary.mode) === 0
            ? filteredMembers.length > 0
              ? filteredMembers[0].contact.uri
              : undefined
            : undefined
        }
        conversationAvatar={conversationSummary.avatar}
        conversationId={conversationId}
        conversationName={conversationName}
        onMessageClick={onClick}
        isSelected={isSelected}
        contextMenuProps={contextMenuHandler.props}
      />
      <CustomListItemButton
        selected={isSelected}
        onClick={onClick}
        onContextMenu={contextMenuHandler.handleAnchorPosition}
        icon={
          <ConversationAvatar
            contactUri={
              Number(conversationSummary.mode) === 0 && filteredMembers.length > 0 ? filteredMembers[0].contact.uri : ''
            }
            displayName={conversationName}
            src={conversationSummary.avatar}
          />
        }
        primaryText={<Typography variant="body1">{conversationName}</Typography>}
        secondaryText={<SecondaryText conversationSummary={conversationSummary} isSelected={isSelected} />}
      />
    </Box>
  )
}

type SecondaryTextProps = {
  conversationSummary: IConversationSummary
  isSelected: boolean
}

const SecondaryText = ({ conversationSummary, isSelected }: SecondaryTextProps) => {
  const { account } = useAuthContext()
  const { callData, callStatus, isAudioOn } = useCallManagerContext()
  const { t, i18n } = useTranslation()

  const timeIndicator = useMemo(() => {
    const message = conversationSummary.lastMessage
    const time = dayjs.unix(Number(message.timestamp))
    if (time.isToday()) {
      return formatTime(time, i18n)
    } else {
      return formatRelativeDate(time, i18n)
    }
  }, [conversationSummary, i18n])

  const [isRead, setIsRead] = useState(false)

  useEffect(() => {
    const status = JSON.parse(JSON.stringify(conversationSummary.lastMessage.status))[account.getUri()]
    if (conversationSummary.lastMessage.author === account.getUri()) {
      setIsRead(true)
    } else if (status === MessageStatusCode.read) {
      setIsRead(true)
    } else {
      setIsRead(false)
    }
  }, [account, conversationSummary, conversationSummary.lastMessage])

  const lastMessageText = useMemo(() => {
    if (!callData || callData.conversationId !== conversationSummary.id) {
      const message = conversationSummary.lastMessage
      switch (message.type) {
        case 'initial': {
          return t('message_swarm_created')
        }
        case 'application/data-transfer+json': {
          return message.displayName
        }
        case 'application/call-history+json': {
          const isAccountMessage = message.author === account.getUri()
          return getMessageCallText(isAccountMessage, message, i18n)
        }
        case 'member': {
          return getMessageMemberText(message, i18n)
        }
        case 'text/plain': {
          return message.body
        }
        default: {
          console.error(`${ConversationSummaryListItem.name} received an unexpected lastMessage type: ${message.type}`)
          return ''
        }
      }
    }

    if (callStatus === CallStatus.InCall) {
      return isAudioOn ? t('ongoing_call_unmuted') : t('ongoing_call_muted')
    }

    if (callStatus === CallStatus.Connecting) {
      return t('connecting_call')
    }

    return callData.role === 'caller' ? t('outgoing_call') : t('incoming_call')
  }, [account, conversationSummary, callData, callStatus, isAudioOn, t, i18n])

  const lastMessageStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '140px',
  }

  return (
    <Stack direction="row" spacing="5px">
      <Typography variant="body2" fontWeight={isSelected ? 'bold' : isRead ? 'normal' : 'bold'}>
        {timeIndicator}
      </Typography>
      {isRead ? (
        <Typography sx={lastMessageStyle} variant="body2">
          {lastMessageText}
        </Typography>
      ) : (
        <Typography sx={lastMessageStyle} fontWeight={'bolder'} variant="body2">
          {lastMessageText}
        </Typography>
      )}
    </Stack>
  )
}

interface ConversationMenuProps {
  conversationId: string
  conversationName: string
  onMessageClick: () => void
  isSelected: boolean
  contextMenuProps: ContextMenuHandler['props']
  conversationAvatar?: string
  conversationMemberUri?: string
}

const ColoredCancelIcon = () => {
  const theme = useTheme()
  return <CancelIcon sx={{ color: theme.SvgIcons.color, width: '16px', height: '16px' }} />
}
const ColoredPersonIcon = () => {
  const theme = useTheme()
  return <PersonIcon sx={{ color: theme.SvgIcons.color, width: '16px', height: '16px' }} />
}
const ColoredMessageIcon = () => {
  const theme = useTheme()
  return <MessageIcon sx={{ color: theme.SvgIcons.color, width: '16px', height: '16px' }} />
}

const ConversationMenu = ({
  conversationMemberUri,
  conversationId,
  conversationName,
  onMessageClick,
  isSelected,
  contextMenuProps,
  conversationAvatar,
}: ConversationMenuProps) => {
  const { t } = useTranslation()
  //const { startCall } = useCallManagerContext()
  const [isSwarm] = useState(true)
  const detailsDialogHandler = useDialogHandler()
  const RemoveConversationDialogHandler = useDialogHandler()

  const navigate = useNavigate()

  const menuOptions: PopoverListItemData[] = useMemo(
    () => [
      {
        label: t('conversation_message'),
        Icon: ColoredMessageIcon,
        onClick: onMessageClick,
      },
      /*{
        label: t('conversation_start_audiocall'),
        Icon: AudioCallIcon,
        onClick: () => {
          if (conversationId) {
            startCall(conversationId)
          }
        },
      },
      {
        label: t('conversation_start_videocall'),
        Icon: VideoCallIcon,
        onClick: () => {
          if (conversationId) {
            startCall(conversationId, true)
          }
        },
      },*/
      ...(isSelected
        ? [
            {
              label: t('conversation_close'),
              Icon: ColoredCancelIcon,
              onClick: () => {
                navigate(`/`)
              },
            },
          ]
        : []),
      {
        label: t('conversation_details'),
        Icon: ColoredPersonIcon,
        onClick: () => {
          detailsDialogHandler.openDialog()
        },
      },
      {
        label: t('conversation_delete'),
        Icon: ColoredCancelIcon,
        onClick: () => {
          RemoveConversationDialogHandler.openDialog()
        },
      },
    ],
    [
      navigate,
      onMessageClick,
      isSelected,
      detailsDialogHandler,
      RemoveConversationDialogHandler,
      t,
      /*startCall,
      conversationId,*/
    ],
  )

  return (
    <>
      <ContextMenu {...contextMenuProps} items={menuOptions} />

      <DetailsDialog
        {...detailsDialogHandler.props}
        conversationId={conversationId}
        conversationName={conversationName}
        conversationAvatar={conversationAvatar}
        conversationMemberUri={conversationMemberUri}
        isSwarm={isSwarm}
      />

      <RemoveConversationDialog
        {...RemoveConversationDialogHandler.props}
        conversationId={conversationId}
        isCurrent={isSelected}
      />
    </>
  )
}

interface DetailsDialogProps {
  conversationId: string
  conversationName: string
  open: boolean
  onClose: () => void
  isSwarm: boolean
  conversationAvatar?: string
  conversationMemberUri?: string
}

const DetailsDialog = ({
  conversationId,
  conversationName,
  open,
  onClose,
  isSwarm,
  conversationAvatar,
  conversationMemberUri,
}: DetailsDialogProps) => {
  const { t } = useTranslation()
  const items = useMemo(
    () => [
      {
        label: t('conversation_details_name'),
        value: conversationName,
      },
      {
        label: t('conversation_details_identifier'),
        value: conversationId,
      },
      {
        label: t('conversation_details_qr_code'),
        value: <QRCodeCanvas size={80} value={`${conversationId}`} />,
      },
      {
        label: t('conversation_details_is_swarm'),
        value: isSwarm ? t('conversation_details_is_swarm_true') : t('conversation_details_is_swarm_false'),
      },
    ],
    [conversationId, conversationName, isSwarm, t],
  )
  return (
    <InfosDialog
      open={open}
      onClose={onClose}
      icon={
        <ConversationAvatar
          src={conversationAvatar}
          contactUri={conversationMemberUri || ''}
          sx={{ width: 'inherit', height: 'inherit' }}
          color={getColor(conversationId)}
          displayName={conversationName}
        />
      }
      title={conversationName}
      content={<DialogContentList title={t('conversation_details_information')} items={items} />}
    />
  )
}
