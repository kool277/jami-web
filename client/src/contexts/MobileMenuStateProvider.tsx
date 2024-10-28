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
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { createOptionalContext } from '../hooks/createOptionalContext'
import { WithChildren } from '../utils/utils'

interface IMobileMenuStateContext {
  isMenuOpen: boolean
  setIsMenuOpen: (value: boolean) => void
}

const optionalMobileMenuStateContext = createOptionalContext<IMobileMenuStateContext>('MobileMenuStateContext')
const MobileMenuStateContext = optionalMobileMenuStateContext.Context
export const useMobileMenuStateContext = optionalMobileMenuStateContext.useOptionalContext

const MobileMenuStateProvider: React.FC<WithChildren> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(true)
  const location = useLocation()
  const url = location.pathname

  useEffect(() => {
    const pageName = url.split('/').pop()
    if (pageName === '' || pageName === 'conversation') {
      setIsMenuOpen(true)
    } else if (url.includes('settings')) {
      // do nothing
    } else {
      // conversation case
      setIsMenuOpen(false)
    }
  }, [url])

  const value = useMemo(
    () => ({
      isMenuOpen,
      setIsMenuOpen,
    }),
    [isMenuOpen],
  )

  return <MobileMenuStateContext.Provider value={value}>{children}</MobileMenuStateContext.Provider>
}

export default MobileMenuStateProvider
