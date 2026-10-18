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

import { chatBackgroundCss, chatBackgroundPresets, parseChatBackground } from './chatBackground.js'

describe('chatBackgroundCss', () => {
  it('leaves the chat pane to the theme by default', () => {
    expect(chatBackgroundCss({ kind: 'default' }, 'light')).toBeUndefined()
  })

  it('paints a preset in its variant for the theme mode', () => {
    const sky = chatBackgroundPresets.find((preset) => preset.id === 'sky')!
    expect(chatBackgroundCss({ kind: 'preset', id: 'sky' }, 'light')).toBe(sky.light)
    expect(chatBackgroundCss({ kind: 'preset', id: 'sky' }, 'dark')).toBe(sky.dark)
  })

  it('paints gradients as well as plain colors', () => {
    expect(chatBackgroundCss({ kind: 'preset', id: 'ocean' }, 'light')).toMatch(/^linear-gradient\(/)
  })

  it('paints a custom color in both modes', () => {
    expect(chatBackgroundCss({ kind: 'color', color: '#336699' }, 'light')).toBe('#336699')
    expect(chatBackgroundCss({ kind: 'color', color: '#336699' }, 'dark')).toBe('#336699')
  })
})

describe('parseChatBackground', () => {
  it('reads back what was stored', () => {
    for (const background of [
      { kind: 'default' },
      { kind: 'preset', id: 'mint' },
      { kind: 'color', color: '#a1b2c3' },
    ] as const) {
      expect(parseChatBackground(JSON.stringify(background))).toEqual(background)
    }
  })

  it('falls back to the default for anything it cannot use', () => {
    for (const stored of [null, '', 'not json', '{"kind":"preset","id":"gone"}', '{"kind":"color","color":"red;x"}']) {
      expect(parseChatBackground(stored)).toEqual({ kind: 'default' })
    }
  })
})
