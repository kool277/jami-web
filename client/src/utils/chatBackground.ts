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
import { PaletteMode } from '@mui/material'

// Each preset has a light and a dark variant, so the text drawn on the chat pane (dates, events)
// stays readable in both theme modes. The same presets exist in the other Jami clients.
export const chatBackgroundPresets = [
  { id: 'sky', light: '#dceefb', dark: '#0f2a3d' },
  { id: 'mint', light: '#dcf2e3', dark: '#0f2e22' },
  { id: 'sand', light: '#f5ead7', dark: '#2e2614' },
  { id: 'rose', light: '#f8dee5', dark: '#33161f' },
  { id: 'lavender', light: '#e7e1f7', dark: '#221a3a' },
  { id: 'slate', light: '#dde2e8', dark: '#1c232b' },
  {
    id: 'sunrise',
    light: 'linear-gradient(135deg, #fde2c8, #f8c8dc)',
    dark: 'linear-gradient(135deg, #3a2418, #3a1a2a)',
  },
  {
    id: 'ocean',
    light: 'linear-gradient(135deg, #cde8f6, #d9d4f5)',
    dark: 'linear-gradient(135deg, #0e2a3a, #211c3e)',
  },
  {
    id: 'meadow',
    light: 'linear-gradient(135deg, #dff2d8, #cfeaf0)',
    dark: 'linear-gradient(135deg, #13301a, #0f2c33)',
  },
  {
    id: 'dusk',
    light: 'linear-gradient(135deg, #e3d9f2, #f6d9e4)',
    dark: 'linear-gradient(135deg, #2b2445, #3b2236)',
  },
] as const

export type ChatBackgroundPresetId = (typeof chatBackgroundPresets)[number]['id']

export type ChatBackground =
  { kind: 'default' } | { kind: 'preset'; id: ChatBackgroundPresetId } | { kind: 'color'; color: string }

const defaultBackground: ChatBackground = { kind: 'default' }
const colorPattern = /^#[0-9a-f]{6}$/i

/** The CSS background of the chat pane, or undefined to keep the theme's. */
export function chatBackgroundCss(background: ChatBackground, mode: PaletteMode): string | undefined {
  switch (background.kind) {
    case 'preset':
      return chatBackgroundPresets.find((preset) => preset.id === background.id)?.[mode]
    case 'color':
      return background.color
    default:
      return undefined
  }
}

/** The chat background stored by a previous session, or the default if it cannot be used. */
export function parseChatBackground(stored: string | null): ChatBackground {
  try {
    const value = JSON.parse(stored ?? '')
    if (value?.kind === 'preset' && chatBackgroundPresets.some((preset) => preset.id === value.id)) {
      return { kind: 'preset', id: value.id }
    }
    if (value?.kind === 'color' && typeof value.color === 'string' && colorPattern.test(value.color)) {
      return { kind: 'color', color: value.color }
    }
  } catch {
    // Not JSON: nothing usable was stored.
  }
  return defaultBackground
}
