/*
 * Copyright (C) 2022 Savoir-faire Linux Inc.
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

import { Dialog, DialogProps, List, Stack, Typography } from '@mui/material'
import { IConversationRequest } from 'jami-web-common'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useConversationDisplayNameShort } from '../hooks/useConversationDisplayName'
import { Contact } from '../models/contact'
import {
  useAcceptConversationRequestMutation,
  useBlockConversationRequestMutation,
  useConversationRequestsQuery,
  useDeclineConversationRequestMutation,
} from '../services/conversationQueries'
import { ColoredRoundButton } from './Button'
import ConversationAvatar from './ConversationAvatar'
import { CustomListItemButton } from './CustomListItemButton'
import { useDialogHandler } from './Dialog'
import LoadingPage from './Loading'
import { CheckMarkIcon, PersonWithCrossMarkIcon, SaltireIcon } from './SvgIcon'

export const ConversationRequestList = () => {
  const conversationRequestsQuery = useConversationRequestsQuery()
  const conversationRequests = conversationRequestsQuery.data

  return (
    <List>
      {conversationRequests?.map((conversationRequest) => (
        <ConversationRequestListItem
          key={conversationRequest.conversationId}
          conversationRequest={conversationRequest}
        />
      ))}
    </List>
  )
}

type ConversationRequestListItemProps = {
  conversationRequest: IConversationRequest
}

const ConversationRequestListItem = ({ conversationRequest }: ConversationRequestListItemProps) => {
  const dialogHandler = useDialogHandler()
  const infos = conversationRequest.infos

  const conversationName = useConversationDisplayNameShort(null, infos.title, conversationRequest.membersNames)

  return (
    <>
      <HandleConversationRequestDialog {...dialogHandler.props} conversationRequest={conversationRequest} />
      <CustomListItemButton
        onClick={dialogHandler.openDialog}
        icon={<ConversationAvatar displayName={conversationName} src={infos.avatar} />}
        primaryText={<Typography variant="body1">{conversationName}</Typography>}
      />
    </>
  )
}

type HandleConversationRequestDialogProps = DialogProps & {
  conversationRequest: IConversationRequest
}

const HandleConversationRequestDialog = ({ conversationRequest, ...props }: HandleConversationRequestDialogProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const {
    conversationId,
    infos: { avatar, title },
  } = conversationRequest

  const contact = useMemo(() => {
    return new Contact(conversationRequest.from.uri, conversationRequest.from.registeredName)
  }, [conversationRequest])

  const closeDialog = useCallback(
    () => props.onClose?.({}, 'escapeKeyDown'), // dummy arguments
    [props]
  )

  const blockConversationRequestMutation = useBlockConversationRequestMutation()
  const acceptConversationRequestMutation = useAcceptConversationRequestMutation()
  const declineConversationRequestMutation = useDeclineConversationRequestMutation()

  const blockConversationRequest = useCallback(() => {
    blockConversationRequestMutation.mutate(
      { conversationId },
      {
        onSettled: closeDialog,
      }
    )
  }, [blockConversationRequestMutation, conversationId, closeDialog])

  const acceptConversationRequest = useCallback(() => {
    acceptConversationRequestMutation.mutate(
      { conversationId },
      {
        onSuccess: () => navigate(`/conversation/${conversationId}`),
        onSettled: closeDialog,
      }
    )
  }, [acceptConversationRequestMutation, conversationId, closeDialog, navigate])

  const declineConversationRequest = useCallback(() => {
    declineConversationRequestMutation.mutate(
      { conversationId },
      {
        onSettled: closeDialog,
      }
    )
  }, [declineConversationRequestMutation, conversationId, closeDialog])

  return (
    <Dialog {...props}>
      <Stack alignItems="center" spacing="40px" position="relative">
        <Typography variant="caption" visibility={acceptConversationRequestMutation.isLoading ? 'hidden' : 'visible'}>
          {t('conversation_request_has_sent_request', { contact: contact.getDisplayName() })}
        </Typography>
        <ConversationAvatar displayName={title} src={avatar} sx={{ width: '112px', height: '112px' }} />
        {acceptConversationRequestMutation.isLoading ? (
          <>
            <Typography variant="h3" whiteSpace="pre-line" textAlign="center" fontWeight="bold">
              {t('conversation_request_accepted')}
            </Typography>
            <Typography variant="caption" whiteSpace="pre-line" textAlign="center">
              {t('conversation_request_waiting_for_sync', { contact: contact.getDisplayName() })}
            </Typography>
            <LoadingPage />
          </>
        ) : (
          <>
            <Typography variant="h3" whiteSpace="pre-line" textAlign="center" fontWeight="bold">
              {t('conversation_request_ask_join')}
            </Typography>
            <Stack direction="row" spacing="30px">
              <ColoredRoundButton
                aria-label="block conversation"
                onClick={blockConversationRequest}
                Icon={PersonWithCrossMarkIcon}
                paletteColor={(theme) => theme.palette.warning}
              />
              <ColoredRoundButton
                aria-label="decline conversation request"
                onClick={declineConversationRequest}
                Icon={SaltireIcon}
                paletteColor={(theme) => theme.palette.error}
              />
              <ColoredRoundButton
                aria-label="accept conversation request"
                onClick={acceptConversationRequest}
                Icon={CheckMarkIcon}
                paletteColor={(theme) => theme.palette.success}
              />
            </Stack>
          </>
        )}
      </Stack>
    </Dialog>
  )
}
