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
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildDefaultTheme } from '../../themes/Default.js'
import AdminPanel from './AdminPanel.js'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('AdminPanel', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
  })

  it('uses the bottom rail without exposing the admin list in compact mode', () => {
    render(
      <ThemeProvider theme={buildDefaultTheme('light', 'ltr')}>
        <MemoryRouter initialEntries={['/admin/settings']}>
          <AdminPanel>
            <div>Configuration</div>
          </AdminPanel>
        </MemoryRouter>
      </ThemeProvider>,
    )

    expect(screen.getByRole('link', { name: 'admin_account_configuration' })).toHaveAttribute(
      'href',
      '/admin/configuration/account',
    )
    expect(screen.getByRole('link', { name: 'admin_account_configuration' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'accounts' })).toHaveAttribute('href', '/admin/accounts')
    expect(screen.getByRole('link', { name: 'authentication' })).toHaveAttribute('href', '/admin/authentication')
    expect(screen.getByRole('button', { name: 'logout' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'admin_page_welcome' })).not.toBeInTheDocument()
  })
})
