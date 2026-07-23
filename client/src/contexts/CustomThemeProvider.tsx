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
import { CssBaseline, PaletteMode } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { createContext, useCallback, useMemo, useState } from 'react'

import { buildDefaultTheme } from '../themes/Default.js'
import { WithChildren } from '../utils/utils.js'

interface ICustomThemeContext {
  mode: PaletteMode
  toggleMode: () => void
}

export const CustomThemeContext = createContext<ICustomThemeContext>(undefined!)

export default ({ children }: WithChildren) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const [selectedMode, setSelectedMode] = useState<PaletteMode | undefined>(() => {
    const themeModeInStorage = localStorage.getItem('themeMode')
    if (typeof themeModeInStorage === 'string') {
      return JSON.parse(themeModeInStorage) === 'dark' ? 'dark' : 'light'
    }
    return undefined
  })
  const mode = selectedMode ?? (prefersDarkMode ? 'dark' : 'light')

  const toggleMode = useCallback(() => {
    setSelectedMode((selectedMode) => {
      const mode = selectedMode ?? (prefersDarkMode ? 'dark' : 'light')
      const newMode = mode === 'light' ? 'dark' : 'light'
      localStorage.setItem('themeMode', JSON.stringify(newMode))
      return newMode
    })
  }, [prefersDarkMode])

  const theme = useMemo(() => buildDefaultTheme(mode), [mode])

  const value = useMemo(
    () => ({
      mode,
      toggleMode,
    }),
    [mode, toggleMode],
  )

  return (
    <CustomThemeContext value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </CustomThemeContext>
  )
}
