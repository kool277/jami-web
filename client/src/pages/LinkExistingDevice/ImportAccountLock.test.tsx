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
import { ThemeProvider } from '@mui/material/styles'
import { DeviceAuthStateCode } from '@savoirfairelinux/jami-web-common'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildDefaultTheme } from '../../themes/Default.js'
import ImportAccountLock from './ImportAccountLock.js'

const { navigate, setAlertContent, importDeviceContext } = vi.hoisted(() => ({
  navigate: vi.fn(),
  setAlertContent: vi.fn(),
  importDeviceContext: {
    value: {
      state: 3 as DeviceAuthStateCode,
      token: 'link-token',
      accountId: 'account-1',
      details: new Map<string, string>(),
    },
  },
}))

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }))
vi.mock('i18next', () => ({ t: (key: string) => key }))
vi.mock('../../contexts/AlertSnackbarProvider.js', async () => {
  const { createContext } = await import('react')
  return { AlertSnackbarContext: createContext({ setAlertContent }) }
})
vi.mock('../../contexts/ImportDeviceProvider.js', () => ({
  useImportDeviceContext: () => importDeviceContext.value,
}))
vi.mock('../../services/accountQueries.js', () => ({
  useProvideAccountAuthentication: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('../../components/UnconnectedUserLayout.js', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const renderPage = () =>
  render(
    <ThemeProvider theme={buildDefaultTheme('light', 'ltr')}>
      <ImportAccountLock />
    </ThemeProvider>,
  )

describe('ImportAccountLock', () => {
  beforeEach(() => {
    navigate.mockClear()
    setAlertContent.mockClear()
    importDeviceContext.value = {
      state: DeviceAuthStateCode.Authenticating,
      token: 'link-token',
      accountId: 'account-1',
      details: new Map<string, string>(),
    }
  })

  it('stays on the page while authenticating', () => {
    renderPage()

    expect(navigate).not.toHaveBeenCalled()
  })

  it('reports a bad password exactly once per failure', () => {
    importDeviceContext.value.details = new Map([
      ['auth_scheme', 'password'],
      ['auth_error', 'bad_password'],
    ])

    const { rerender } = renderPage()
    rerender(
      <ThemeProvider theme={buildDefaultTheme('light', 'ltr')}>
        <ImportAccountLock />
      </ThemeProvider>,
    )

    expect(setAlertContent).toHaveBeenCalledTimes(1)
    expect(setAlertContent).toHaveBeenCalledWith({
      messageI18nKey: 'auth_error_while_linking_device',
      severity: 'error',
      alertOpen: true,
    })
  })

  it('follows the flow when the transfer starts', () => {
    importDeviceContext.value.state = DeviceAuthStateCode.InProgress

    renderPage()

    expect(navigate).toHaveBeenCalledWith('/import-account-in-progress')
  })
})
