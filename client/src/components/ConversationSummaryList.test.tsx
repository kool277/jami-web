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
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buildDefaultTheme } from '../themes/Default.js'
import { ConversationSummaryList } from './ConversationSummaryList.js'

describe('ConversationSummaryList', () => {
  // The list is a flex child of the scrolling pane: letting it shrink would make it
  // clip its own items instead of overflowing, leaving nothing for the pane to scroll.
  it('keeps its natural height so the surrounding pane can scroll', () => {
    const { container } = render(
      <ThemeProvider theme={buildDefaultTheme('light', 'ltr')}>
        <ConversationSummaryList conversationsSummaries={[]} />
      </ThemeProvider>,
    )

    expect(container.querySelector('ul')).toHaveStyle({ flexShrink: '0' })
  })
})
