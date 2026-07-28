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
import { IconButton, InputBase, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { lazy, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAppBackgroundContext } from '../contexts/AppBackgroundProvider.js'
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
import { useMobileMenuStateContext } from '../contexts/MobileMenuStateProvider.js'
//import CallInterface from '../pages/CallInterface.js'
const CallInterface = lazy(() => import('../pages/CallInterface.js'))
import ChatInterface from '../pages/ChatInterface.js'
import BaseIconButton from './common/BaseIconButton.js'
import ConversationAvatar from './ConversationAvatar.js'
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
  const { setTintColor } = useAppBackgroundContext()

  useEffect(() => {
    setTintColor(conversationColor)
    return () => setTintColor(null)
  }, [conversationColor, setTintColor])

  return (
    <Stack
      sx={{
        flexGrow: 1,
        height: '100%',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ChatInterface />
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
  const navigate = useNavigate()
  const { setIsMenuOpen } = useMobileMenuStateContext()

  const otherMember = useMemo(() => members?.find((m) => m.contact.uri !== account.getUri()), [members, account])
  const contactUri = otherMember?.contact.uri ?? ''
  const subtitle = otherMember?.contact.registeredName

  const onMenuIconClick = () => {
    setIsMenuOpen(true)
    if (location.pathname.startsWith('/conversation')) {
      navigate('/conversation')
    }
  }

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
        backgroundColor: alpha(theme.ChatInterface.backgroundColor, 0.82),
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
            <IconButton
              onClick={() => onMenuIconClick()}
              sx={{
                height: '36px',
                width: '36px',
                borderRadius: '50%',
              }}
            >
              <ArrowBackIosNewIcon sx={{ fontSize: 20 }} />
            </IconButton>
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
