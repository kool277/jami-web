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
import { describe, expect, it, vi } from 'vitest'

import { buildDefaultTheme } from '../../themes/Default.js'
import SettingsNavigation from './SettingsNavigation.js'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const renderSettingsNavigation = (path: string) =>
  render(
    <ThemeProvider theme={buildDefaultTheme('light', 'ltr')}>
      <MemoryRouter initialEntries={[path]}>
        <SettingsNavigation />
      </MemoryRouter>
    </ThemeProvider>,
  )

describe('SettingsNavigation', () => {
  it('exposes every settings page as a navigable link', () => {
    renderSettingsNavigation('/settings')

    expect(screen.getByRole('link', { name: 'settings_manage_account' })).toHaveAttribute(
      'href',
      '/settings/account/manage-account',
    )
    expect(screen.getByRole('link', { name: 'settings_calls' })).toHaveAttribute('href', '/settings/account/calls')
    expect(screen.getByRole('link', { name: 'settings_linked_devices' })).toHaveAttribute(
      'href',
      '/settings/account/linked-devices',
    )
    expect(screen.getByRole('link', { name: 'settings_title_system' })).toHaveAttribute(
      'href',
      '/settings/general/system',
    )
    expect(screen.getByRole('link', { name: 'settings_appearance' })).toHaveAttribute(
      'href',
      '/settings/general/appearance',
    )
    expect(screen.getByRole('link', { name: 'settings_title_chat' })).toHaveAttribute('href', '/settings/general/chat')
  })

  it('marks the route-matched page as current', () => {
    renderSettingsNavigation('/settings/account/linked-devices')

    expect(screen.getByRole('link', { name: 'settings_linked_devices' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'settings_manage_account' })).not.toHaveAttribute('aria-current')
  })
})
