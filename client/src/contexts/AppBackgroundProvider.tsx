/*
 * Copyright (C) 2025 Savoir-faire Linux Inc.
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
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'

interface AppBackgroundContextValue {
  tintColor: string | null
  setTintColor: (color: string | null) => void
}

const AppBackgroundContext = createContext<AppBackgroundContextValue>({
  tintColor: null,
  setTintColor: () => {},
})

export const useAppBackgroundContext = () => useContext(AppBackgroundContext)

export const AppBackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [tintColor, setTintColorState] = useState<string | null>(null)
  const setTintColor = useCallback((color: string | null) => setTintColorState(color), [])
  const value = useMemo(() => ({ tintColor, setTintColor }), [tintColor, setTintColor])
  return <AppBackgroundContext.Provider value={value}>{children}</AppBackgroundContext.Provider>
}
