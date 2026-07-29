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
import { Button, ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buildDefaultTheme } from '../../themes/Default.js'
import { SettingsPage, SettingsRow, SettingsSection } from './SettingsPage.js'

describe('SettingsPage', () => {
  it('provides page and section hierarchy around accessible controls', () => {
    render(
      <ThemeProvider theme={buildDefaultTheme('light', 'ltr')}>
        <SettingsPage title="General" description="App preferences">
          <SettingsSection title="System" description="Device-wide preferences">
            <SettingsRow
              title="Notifications"
              description="Show alerts for activity"
              control={<Button>Configure</Button>}
            />
          </SettingsSection>
        </SettingsPage>
      </ThemeProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'General' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 2, name: 'System' })).toBeVisible()
    expect(screen.getByText('App preferences')).toBeVisible()
    expect(screen.getByText('Show alerts for activity')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Configure' })).toBeVisible()
  })
})
