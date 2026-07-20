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
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { type ContextType } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider.js'
import { Account } from '../models/account.js'
import { buildDefaultTheme } from '../themes/Default.js'
import JamiIdDisplay from './JamiIdDisplay.js'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('./SvgIcon.js', () => ({
  ContentCopyIcon: () => <span />,
  JamiIdIcon: () => <span />,
  QrCodeIcon: () => <span />,
}))

const jamiUri = 'jami:0123456789abcdef'

function createAccount() {
  const account = Object.create(Account.prototype)
  vi.spyOn(account, 'getUri').mockReturnValue(jamiUri)
  return account
}

function renderJamiIdDisplay(setAlertContent = vi.fn()) {
  const alertContext: ContextType<typeof AlertSnackbarContext> = {
    alertContent: {
      alertOpen: false,
      messageI18nKey: '',
      severity: 'info',
    },
    closeAlert: () => {},
    setAlertContent,
  }

  render(
    <ThemeProvider theme={buildDefaultTheme('light', 'ltr')}>
      <AlertSnackbarContext value={alertContext}>
        <JamiIdDisplay account={createAccount()} />
      </AlertSnackbarContext>
    </ThemeProvider>,
  )

  return setAlertContent
}

function setClipboard(writeText: ReturnType<typeof vi.fn> | undefined) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: writeText === undefined ? undefined : { writeText },
  })
}

describe('JamiIdDisplay clipboard feedback', () => {
  it('copies the account URI and shows a success notification', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn()
    setClipboard(writeText)
    const setAlertContent = renderJamiIdDisplay()

    await user.click(screen.getByRole('button', { name: 'copy_to_clipboard' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(jamiUri))
    expect(setAlertContent).toHaveBeenCalledWith({
      alertOpen: true,
      messageI18nKey: 'copied_to_clipboard',
      severity: 'success',
    })
  })

  it('shows an error notification when clipboard access is rejected', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard denied'))
    setClipboard(writeText)
    const setAlertContent = renderJamiIdDisplay()

    await user.click(screen.getByRole('button', { name: 'copy_to_clipboard' }))

    await waitFor(() =>
      expect(setAlertContent).toHaveBeenCalledWith({
        alertOpen: true,
        messageI18nKey: 'unknown_error_alert',
        severity: 'error',
      }),
    )
  })

  it('shows an error notification when clipboard access is unavailable', async () => {
    const user = userEvent.setup()
    setClipboard(undefined)
    const setAlertContent = renderJamiIdDisplay()

    await user.click(screen.getByRole('button', { name: 'copy_to_clipboard' }))

    await waitFor(() =>
      expect(setAlertContent).toHaveBeenCalledWith({
        alertOpen: true,
        messageI18nKey: 'unknown_error_alert',
        severity: 'error',
      }),
    )
  })
})
