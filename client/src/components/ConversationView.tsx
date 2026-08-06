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
import { InputBase, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { alpha, darken, lighten } from '@mui/material/styles'
import { lazy, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuthContext } from '../contexts/AuthProvider.js'
import { useCallManagerContext } from '../contexts/CallManagerProvider.js'
import ConversationPreferencesColorProvider, {
  useConversationPreferencesColorContext,
} from '../contexts/ConversationPreferencesColorContext.js'
import ConversationPreferencesNotificationsProvider from '../contexts/ConversationPreferencesNotificationsContext.js'
import ConversationPreferencesStateProvider, {
  useConversationPreferencesStateContext,
} from '../contexts/ConversationPreferencesStateContext.js'
import { useConversationContext } from '../contexts/ConversationProvider.js'
//import CallInterface from '../pages/CallInterface.js'
const CallInterface = lazy(() => import('../pages/CallInterface.js'))
import ChatInterface from '../pages/ChatInterface.js'
import BaseIconButton from './common/BaseIconButton.js'
import Island, { ISLAND_MARGIN } from './common/Island.js'
import ConversationAvatar from './ConversationAvatar.js'
import ConversationPreferences from './ConversationPreferences.js'
import { ArrowBackIosNewIcon } from './SvgIcon.js'
import { AudioCallIcon, ListIcon, SearchRoundedIcon, VideoCallIcon } from './SvgIcon.js'

const ConversationView = () => {
  const { conversationId } = useConversationContext()
  const { callData } = useCallManagerContext()

  if (callData?.conversationId === conversationId) {
    return <CallInterface />
  }

  return (
    <ConversationPreferencesStateProvider>
      <ConversationPreferencesNotificationsProvider>
        <ConversationPreferencesColorProvider>
          <ConversationContent />
        </ConversationPreferencesColorProvider>
      </ConversationPreferencesNotificationsProvider>
    </ConversationPreferencesStateProvider>
  )
}

const ConversationContent = () => {
  const { conversationColor } = useConversationPreferencesColorContext()
  const { isOpen } = useConversationPreferencesStateContext()
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const isMedium: boolean = useMediaQuery(theme.breakpoints.only('sm'))
  // The conversation colour washes the chat pane rather than the whole window, so
  // the pane stays identifiable without tinting the rest of the shell.
  const background = conversationColor
    ? theme.palette.mode === 'dark'
      ? darken(conversationColor, 0.85)
      : lighten(conversationColor, 0.85)
    : 'background.default'

  return (
    <Stack direction="row" sx={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
      <Stack
        sx={{
          flex: isOpen && (isMobile || isMedium) ? '0 1 0px' : 1,
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <Island
          sx={{
            flex: 1,
            m: ISLAND_MARGIN,
            ml: 0,
            position: 'relative',
            backgroundColor: background,
            transition: 'background-color 0.6s ease-in-out',
          }}
        >
          <ChatInterface />
        </Island>
      </Stack>
      <ConversationPreferences />
    </Stack>
  )
}

export const ConversationHeader = () => {
  const { t } = useTranslation()
  const { conversationDisplayName, conversationId, members } = useConversationContext()
  const { account } = useAuthContext()
  const { startCall } = useCallManagerContext()
  const { isOpen, setIsOpen, isSearchOpen, setIsSearchOpen, setSearchQuery } = useConversationPreferencesStateContext()
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))

  const otherMember = useMemo(() => members?.find((m) => m.contact.uri !== account.getUri()), [members, account])
  const contactUri = otherMember?.contact.uri ?? ''
  const subtitle = otherMember?.contact.registeredName

  const handleSearchClose = () => {
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <Stack
      direction="row"
      sx={{
        padding: '4px 6px 4px 4px',
        overflow: 'hidden',
        alignItems: 'center',
        position: 'absolute',
        top: 8,
        left: 12,
        right: 12,
        zIndex: 20,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        backgroundColor: alpha(theme.palette.background.default, 0.82),
        boxShadow: theme.shadows[3],
        borderRadius: '9999px',
        maxWidth: '600px',
        mx: 'auto',
      }}
    >
      {isSearchOpen ? (
        <>
          <BaseIconButton
            aria-label={t('conversation_search_close')}
            tooltip={t('conversation_search_close')}
            onClick={handleSearchClose}
            sx={{ flexShrink: 0 }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 20 }} />
          </BaseIconButton>
          <InputBase
            autoFocus
            inputProps={{ 'aria-label': t('conversation_search') }}
            placeholder={t('conversation_search')}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1 }}
          />
        </>
      ) : (
        <>
          <Stack
            direction="row"
            spacing="12px"
            sx={{
              flex: 1,
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {contactUri && (
              <ConversationAvatar
                displayName={conversationDisplayName}
                contactUri={contactUri}
                presence={true}
                sx={{ width: 36, height: 36, fontSize: '0.9rem' }}
              />
            )}
            <Stack
              sx={{
                overflow: 'hidden',
                justifyContent: 'center',
              }}
            >
              <Typography
                noWrap
                variant="h4"
                sx={{
                  textOverflow: 'ellipsis',
                  maxWidth: isMobile ? '120px' : '400px',
                }}
              >
                {conversationDisplayName}
              </Typography>
              {subtitle && subtitle !== conversationDisplayName && (
                <Typography
                  noWrap
                  variant="caption"
                  sx={{
                    textOverflow: 'ellipsis',
                    color: theme.palette.text.secondary,
                    maxWidth: isMobile ? '120px' : '400px',
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Stack>
          </Stack>
          <Stack
            direction="row"
            spacing="12px"
            sx={{
              alignItems: 'center',
            }}
          >
            <BaseIconButton
              aria-label={t('conversation_start_audiocall')}
              tooltip={t('conversation_start_audiocall')}
              onClick={() => startCall(conversationId)}
            >
              <AudioCallIcon />
            </BaseIconButton>
            <BaseIconButton
              aria-label={t('conversation_start_videocall')}
              tooltip={t('conversation_start_videocall')}
              onClick={() => startCall(conversationId, true)}
            >
              <VideoCallIcon />
            </BaseIconButton>
            <BaseIconButton
              aria-label={t('conversation_search')}
              tooltip={t('conversation_search')}
              onClick={() => setIsSearchOpen(true)}
            >
              <SearchRoundedIcon sx={{ fontSize: 22 }} />
            </BaseIconButton>
            <BaseIconButton
              aria-label={t('conversation_show_options')}
              tooltip={t('conversation_show_options')}
              onClick={() => setIsOpen(!isOpen)}
            >
              <ListIcon />
            </BaseIconButton>
          </Stack>
        </>
      )}
    </Stack>
  )
}

export default ConversationView
