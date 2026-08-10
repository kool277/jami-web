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
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { buildDefaultTheme } from '../../themes/Default.js'
import AdminAccountDialog from './AdminAccountDialog.js'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

describe('AdminAccountDialog', () => {
  it('submits a confirmed local account password and username', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <ThemeProvider theme={buildDefaultTheme('light', 'ltr')}>
        <AdminAccountDialog open mode="create" pending={false} onClose={vi.fn()} onSubmit={onSubmit} />
      </ThemeProvider>,
    )

    await user.type(screen.getByLabelText(/admin_page_accounts_overview_title_username/), 'alice')
    await user.type(screen.getByLabelText(/admin_page_password_placeholder/), 'secure-password')
    await user.type(screen.getByLabelText(/admin_page_password_repeat_placeholder/), 'secure-password')
    await user.click(screen.getByRole('button', { name: 'admin_account_create' }))

    expect(onSubmit).toHaveBeenCalledWith({ username: 'alice', password: 'secure-password' })
  })
})
