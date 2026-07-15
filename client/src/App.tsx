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
import './dayjsInitializer.js' // Initialized once and globally to ensure available locales are always imported

import { getAdminSetupRedirect } from '@savoirfairelinux/jami-web-common'
import axios from 'axios'
import { Suspense, useState } from 'react'
import { LoaderFunctionArgs, Outlet, redirect } from 'react-router-dom'

import WelcomeAnimation from './components/WelcomeAnimation.js'
import { getAccessToken, setAccessToken } from './services/authQueries.js'
import { apiUrl } from './utils/constants.js'
import { isElectronMode } from './utils/electron.js'

export async function appLoader({ request }: LoaderFunctionArgs) {
  const initialUrl = new URL(request.url)
  const electronMode = isElectronMode()
  const path = initialUrl.pathname

  // In Electron mode, admin setup is bypassed and auto-login is attempted
  if (electronMode) {
    // If user is navigating to admin panel, let them through
    if (path.startsWith('/admin')) {
      return null
    }

    // If already authenticated, proceed normally
    if (getAccessToken()) {
      return null
    }

    // Try auto-login: fetch local accounts and login to the first one
    try {
      const { data } = await axios.get<{
        accounts: Array<{ id: string; registeredName: string; displayName: string }>
      }>('/auth/local-accounts', { baseURL: apiUrl })
      if (data.accounts.length >= 1) {
        const lastUsedId = localStorage.getItem('lastLoginAccountId')
        const target = (lastUsedId && data.accounts.find((a) => a.id === lastUsedId)) || data.accounts[0]
        const { data: loginData } = await axios.post(
          '/auth/switch-account',
          { accountId: target.id },
          { baseURL: apiUrl },
        )
        setAccessToken(loginData.accessToken)
        localStorage.setItem('lastLoginAccountId', target.id)
        return redirect('/conversation')
      }
      // No accounts: send to registration
    } catch {
      // Auto-login failed, fall through to normal routing
    }

    return null
  }

  return null
}

export async function adminSetupLoader({ request }: LoaderFunctionArgs) {
  if (window.electronAPI?.isElectron) {
    return null
  }

  const { checkWizardStatus } = await import('./admin/index.js')
  const lastWizardState = await checkWizardStatus()
  if (lastWizardState !== undefined) {
    const redirectPath = getAdminSetupRedirect(new URL(request.url).pathname, lastWizardState)
    if (redirectPath) {
      return redirect(redirectPath)
    }
  }

  return null
}

const App = () => {
  const [displayWelcome, setDisplayWelcome] = useState<boolean>(() => getAccessToken() === undefined)

  if (displayWelcome) {
    return <WelcomeAnimation onComplete={() => setDisplayWelcome(false)} />
  }

  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  )
}

export default App
