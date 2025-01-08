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
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { buildDefaultTheme } from '../themes/Default'
import { WithChildren } from '../utils/utils'

interface ICustomThemeContext {
  mode: PaletteMode
  toggleMode: () => void
}

export const CustomThemeContext = createContext<ICustomThemeContext>(undefined!)

export default ({ children }: WithChildren) => {
  const [mode, setMode] = useState<PaletteMode>('light')
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  useEffect(() => {
    const themeModeInStorage = localStorage.getItem('themeMode')
    let themeModeValue = 'light'
    // localStorage returns null if no value is found for the given key
    if (typeof themeModeInStorage === 'string') {
      themeModeValue = JSON.parse(themeModeInStorage)
      setMode(themeModeValue === 'dark' ? 'dark' : 'light')
    } else {
      //when there is no theme mode stored in the localStorage, use the mode in OS preference
      setMode(prefersDarkMode ? 'dark' : 'light')
    }
  }, [prefersDarkMode])

  const toggleMode = useCallback(() => {
    setMode((mode) => {
      const newMode = mode === 'light' ? 'dark' : 'light'
      localStorage.setItem('themeMode', JSON.stringify(newMode))
      return newMode
    })
  }, [setMode])

  const theme = useMemo(() => buildDefaultTheme(mode), [mode])

  const value = useMemo(
    () => ({
      mode,
      toggleMode,
    }),
    [mode, toggleMode],
  )

  return (
    <CustomThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </CustomThemeContext.Provider>
  )
}
