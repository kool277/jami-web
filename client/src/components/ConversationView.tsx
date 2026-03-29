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
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppBackgroundContext } from '../contexts/AppBackgroundProvider'
import { useAuthContext } from '../contexts/AuthProvider'
import { useCallManagerContext } from '../contexts/CallManagerProvider'
import ConversationPreferencesColorProvider, {
  useConversationPreferencesColorContext,
} from '../contexts/ConversationPreferencesColorContext'
import ConversationPreferencesNotificationsProvider from '../contexts/ConversationPreferencesNotificationsContext'
import ConversationPreferencesStateProvider, {
  useConversationPreferencesStateContext,
} from '../contexts/ConversationPreferencesStateContext'
import { useConversationContext } from '../contexts/ConversationProvider'
import { useMobileMenuStateContext } from '../contexts/MobileMenuStateProvider'
import CallInterface from '../pages/CallInterface'
import ChatInterface from '../pages/ChatInterface'
import { StartAudioCallButton, StartVideoCallButton } from './Button'
import { ShowOptionsMenuButton } from './Button'
import ConversationAvatar from './ConversationAvatar'
import { ArrowBackIosNewIcon } from './SvgIcon'
import { SearchRoundedIcon } from './SvgIcon'

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
      flexGrow={1}
      height="100%"
      width="100%"
      sx={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ChatInterface />
    </Stack>
  )
}

export const ConversationHeader = () => {
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
      padding="4px 6px 4px 16px"
      overflow="hidden"
      alignItems="center"
      sx={{
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
          <ArrowBackIosNewIcon
            sx={{ fontSize: 20, mr: 1, flexShrink: 0, '&:hover': { cursor: 'pointer' } }}
            onClick={handleSearchClose}
          />
          <InputBase
            autoFocus
            placeholder="Search in conversation…"
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, fontSize: '0.95rem' }}
          />
        </>
      ) : (
        <>
          <Stack flex={1} direction="row" alignItems="center" overflow="hidden" spacing="12px">
            <ArrowBackIosNewIcon
              sx={{ fontSize: 20, '&:hover': { cursor: 'pointer' } }}
              onClick={() => onMenuIconClick()}
            />
            {contactUri && (
              <ConversationAvatar
                displayName={conversationDisplayName}
                contactUri={contactUri}
                presence={true}
                sx={{ width: 36, height: 36, fontSize: '0.9rem' }}
              />
            )}
            <Stack overflow="hidden" justifyContent="center">
              <Typography
                noWrap
                textOverflow="ellipsis"
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  maxWidth: isMobile ? '120px' : '400px',
                }}
              >
                {conversationDisplayName}
              </Typography>
              {subtitle && subtitle !== conversationDisplayName && (
                <Typography
                  noWrap
                  textOverflow="ellipsis"
                  sx={{
                    fontSize: '0.75rem',
                    color: theme.palette.text.secondary,
                    maxWidth: isMobile ? '120px' : '400px',
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Stack>
          </Stack>
          <Stack direction="row" spacing="12px" alignItems="center">
            <StartAudioCallButton onClick={() => startCall(conversationId)} />
            <StartVideoCallButton onClick={() => startCall(conversationId, true)} />
            <SearchRoundedIcon
              sx={{
                fontSize: 22,
                cursor: 'pointer',
                color: theme.Buttons.color,
                '&:hover': { color: theme.palette.text.primary },
              }}
              onClick={() => setIsSearchOpen(true)}
            />
            <ShowOptionsMenuButton
              onClick={() => {
                setIsOpen(!isOpen)
              }}
            />
          </Stack>
        </>
      )}
    </Stack>
  )
}

export default ConversationView
