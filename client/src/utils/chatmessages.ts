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
import dayjs from 'dayjs'
import { i18n } from 'i18next'
import { Message } from 'jami-web-common'

import { formatCallDuration } from './dates&times'

export const getMessageCallText = (isAccountMessage: boolean, message: Message, i18n: i18n) => {
  const callDuration = dayjs.duration(parseInt(message?.duration || ''))
  const formattedCallDuration = formatCallDuration(callDuration)
  if (callDuration.asSeconds() === 0) {
    if (isAccountMessage) {
      return i18n.t('message_call_outgoing_missed')
    } else {
      return i18n.t('message_call_incoming_missed')
    }
  } else {
    if (isAccountMessage) {
      return i18n.t('message_call_outgoing', formattedCallDuration)
    } else {
      return i18n.t('message_call_incoming', formattedCallDuration)
    }
  }
}

export const getMessageMemberText = (message: Message, i18n: i18n) => {
  switch (message.action) {
    case 'add':
      return i18n.t('message_member_invited', { user: message.author })
    case 'join':
      return i18n.t('message_member_joined', { user: message.author })
    case 'remove':
      return i18n.t('message_member_left', { user: message.author })
    case 'ban':
      return i18n.t('message_member_banned', { user: message.author })
    case 'unban':
      return i18n.t('message_member_unbanned', { user: message.author })
    default:
      console.error(`${getMessageMemberText.name} received an unexpected message action: ${message.action}`)
  }
}
