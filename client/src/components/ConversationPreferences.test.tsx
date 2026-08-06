/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
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
import { describe, expect, it } from 'vitest'

import { getConversationPreferencesTransition, getConversationType } from './ConversationPreferences.js'

describe('ConversationPreferences', () => {
  it('slides without bouncing and respects disabled animations', () => {
    expect(getConversationPreferencesTransition(true)).toEqual({
      type: 'tween',
      duration: 0.2,
      ease: 'easeOut',
    })
    expect(getConversationPreferencesTransition(false)).toEqual({ duration: 0 })
  })

  it('identifies direct and group conversations from their member count', () => {
    expect(getConversationType(2)).toBe('private')
    expect(getConversationType(3)).toBe('group')
  })
})
