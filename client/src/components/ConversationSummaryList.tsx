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
import dayjs from 'dayjs'
import { IConversationSummary } from 'jami-web-common'
import { QRCodeCanvas } from 'qrcode.react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAuthContext } from '../contexts/AuthProvider'
import { useCallManagerContext } from '../contexts/CallManagerProvider'
import { useConversationDisplayNameShort } from '../hooks/useConversationDisplayName'
import { useUrlParams } from '../hooks/useUrlParams'
import { ConversationRouteParams } from '../router'
import { CallStatus } from '../services/CallManager'
import { useRemoveConversationMutation } from '../services/conversationQueries'
import { getMessageCallText, getMessageMemberText } from '../utils/chatmessages'
import { formatRelativeDate, formatTime } from '../utils/dates&times'
import ContextMenu, { ContextMenuHandler, useContextMenuHandler } from './ContextMenu'
import ConversationAvatar from './ConversationAvatar'
import { CustomListItemButton } from './CustomListItemButton'
import { ConfirmationDialog, DialogContentList, InfosDialog, useDialogHandler } from './Dialog'
import { PopoverListItemData } from './PopoverList'
import { AudioCallIcon, CancelIcon, MessageIcon, PersonIcon, VideoCallIcon } from './SvgIcon'

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

  const conversationId = conversationSummary.id
  const isSelected = conversationId === selectedConversationId

  const onClick = useCallback(() => {
    if (conversationId) {
      navigate(`/conversation/${conversationId}`)
    }
  }, [navigate, conversationId])

  const conversationName = useConversationDisplayNameShort(
    account,
    conversationSummary.title,
    conversationSummary.membersNames,
  )

  return (
    <Box>
      <ConversationMenu
        conversationId={conversationId}
        conversationName={conversationName}
        onMessageClick={onClick}
        isSelected={isSelected}
        contextMenuProps={contextMenuHandler.props}
      />
      <CustomListItemButton
        data-cy={`conversation-summary-item`}
        selected={isSelected}
        onClick={onClick}
        onContextMenu={contextMenuHandler.handleAnchorPosition}
        icon={<ConversationAvatar displayName={conversationName} src={conversationSummary.avatar} />}
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

  return (
    <Stack direction="row" spacing="5px">
      <Typography variant="body2" fontWeight={isSelected ? 'bold' : 'normal'}>
        {timeIndicator}
      </Typography>
      <Typography sx={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }} variant="body2">
        {lastMessageText}
      </Typography>
    </Stack>
  )
}

interface ConversationMenuProps {
  conversationId: string
  conversationName: string
  onMessageClick: () => void
  isSelected: boolean
  contextMenuProps: ContextMenuHandler['props']
}

const ConversationMenu = ({
  conversationId,
  conversationName,
  onMessageClick,
  isSelected,
  contextMenuProps,
}: ConversationMenuProps) => {
  const { t } = useTranslation()
  const { startCall } = useCallManagerContext()
  const [isSwarm] = useState(true)

  const detailsDialogHandler = useDialogHandler()
  const RemoveConversationDialogHandler = useDialogHandler()

  const navigate = useNavigate()

  const menuOptions: PopoverListItemData[] = useMemo(
    () => [
      {
        label: t('conversation_message'),
        Icon: MessageIcon,
        onClick: onMessageClick,
      },
      {
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
      },
      ...(isSelected
        ? [
            {
              label: t('conversation_close'),
              Icon: CancelIcon,
              onClick: () => {
                navigate(`/`)
              },
            },
          ]
        : []),
      {
        label: t('conversation_details'),
        Icon: PersonIcon,
        onClick: () => {
          detailsDialogHandler.openDialog()
        },
      },
      {
        label: t('conversation_delete'),
        Icon: CancelIcon,
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
      startCall,
      conversationId,
    ],
  )

  return (
    <>
      <ContextMenu {...contextMenuProps} items={menuOptions} />

      <DetailsDialog
        {...detailsDialogHandler.props}
        conversationId={conversationId}
        conversationName={conversationName}
        isSwarm={isSwarm}
      />

      <RemoveConversationDialog
        {...RemoveConversationDialogHandler.props}
        conversationId={conversationId}
        isSelected={isSelected}
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
}

const DetailsDialog = ({ conversationId, conversationName, open, onClose, isSwarm }: DetailsDialogProps) => {
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
      icon={<ConversationAvatar sx={{ width: 'inherit', height: 'inherit' }} displayName={conversationName} />}
      title={conversationName}
      content={<DialogContentList title={t('conversation_details_informations')} items={items} />}
    />
  )
}

interface RemoveConversationDialogProps {
  conversationId: string
  isSelected: boolean
  open: boolean
  onClose: () => void
}

const RemoveConversationDialog = ({ conversationId, isSelected, open, onClose }: RemoveConversationDialogProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const removeConversationMutation = useRemoveConversationMutation()

  const remove = useCallback(async () => {
    removeConversationMutation.mutate(
      { conversationId },
      {
        onSuccess: () => {
          if (isSelected) {
            navigate('/conversation/')
          }
        },
        onError: (e) => {
          console.error(`Error removing conversation : `, e)
        },
        onSettled: () => {
          onClose()
        },
      },
    )
  }, [conversationId, isSelected, navigate, onClose, removeConversationMutation])

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title={t('dialog_confirm_title_default')}
      content={t('conversation_ask_confirm_remove')}
      onConfirm={remove}
      confirmButtonText={t('conversation_confirm_remove')}
    />
  )
}
