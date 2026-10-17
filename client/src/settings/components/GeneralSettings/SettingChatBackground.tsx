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
import { Box, ButtonBase, Stack, Tooltip, useTheme } from '@mui/material'
import { use, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { CustomThemeContext } from '../../../contexts/CustomThemeProvider.js'
import { ChatBackgroundPresetId, chatBackgroundPresets } from '../../../utils/chatBackground.js'

interface SwatchProps {
  label: string
  background: string
  selected: boolean
  onClick: () => void
}

const Swatch = ({ label, background, selected, onClick }: SwatchProps) => {
  const theme = useTheme()
  return (
    <Tooltip title={label}>
      <ButtonBase
        aria-label={label}
        aria-pressed={selected}
        onClick={onClick}
        sx={{
          position: 'relative',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background,
          border: `1px solid ${theme.palette.divider}`,
          outline: selected ? `3px solid ${theme.palette.primary.main}` : 'none',
          outlineOffset: 2,
        }}
      />
    </Tooltip>
  )
}

const SettingChatBackground = () => {
  const { t } = useTranslation()
  const theme = useTheme()
  const { chatBackground, setChatBackground } = use(CustomThemeContext)
  const colorInput = useRef<HTMLInputElement>(null)

  const presetLabels: Record<ChatBackgroundPresetId, string> = {
    sky: t('chat_background_sky'),
    mint: t('chat_background_mint'),
    sand: t('chat_background_sand'),
    rose: t('chat_background_rose'),
    lavender: t('chat_background_lavender'),
    slate: t('chat_background_slate'),
    sunrise: t('chat_background_sunrise'),
    ocean: t('chat_background_ocean'),
    meadow: t('chat_background_meadow'),
    dusk: t('chat_background_dusk'),
  }
  const customLabel = t('settings_chat_background_custom')
  // The default swatch is the theme's background crossed out, the usual mark for "none".
  const defaultSwatch = `linear-gradient(135deg, transparent 46%, ${theme.palette.divider} 46%, ${theme.palette.divider} 54%, transparent 54%), ${theme.palette.background.default}`

  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5, py: 0.5 }}>
      <Swatch
        label={t('settings_chat_background_default')}
        background={defaultSwatch}
        selected={chatBackground.kind === 'default'}
        onClick={() => setChatBackground({ kind: 'default' })}
      />
      {chatBackgroundPresets.map((preset) => (
        <Swatch
          key={preset.id}
          label={presetLabels[preset.id]}
          background={preset[theme.palette.mode]}
          selected={chatBackground.kind === 'preset' && chatBackground.id === preset.id}
          onClick={() => setChatBackground({ kind: 'preset', id: preset.id })}
        />
      ))}
      <Box sx={{ position: 'relative' }}>
        <Swatch
          label={customLabel}
          background={
            chatBackground.kind === 'color'
              ? chatBackground.color
              : 'conic-gradient(#f44336, #ffeb3b, #4caf50, #00bcd4, #3f51b5, #e91e63, #f44336)'
          }
          selected={chatBackground.kind === 'color'}
          onClick={() => colorInput.current?.click()}
        />
        {/* The swatch opens the browser's color picker, which this hidden input holds. */}
        <input
          ref={colorInput}
          type="color"
          aria-label={customLabel}
          tabIndex={-1}
          value={chatBackground.kind === 'color' ? chatBackground.color : '#888888'}
          onChange={(event) => setChatBackground({ kind: 'color', color: event.target.value })}
          style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none' }}
        />
      </Box>
    </Stack>
  )
}

export default SettingChatBackground
