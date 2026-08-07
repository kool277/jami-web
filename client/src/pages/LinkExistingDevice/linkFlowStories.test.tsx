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
import { composeStories } from '@storybook/react-vite'
import { render } from '@testing-library/react'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'

import * as importAccount from './ImportAccount.stories.js'
import * as confirmation from './ImportAccountConfirmation.stories.js'
import * as connecting from './ImportAccountConnecting.stories.js'
import * as lock from './ImportAccountLock.stories.js'
import * as transfer from './ImportAccountTransferInProgress.stories.js'

/**
 * The stories are the only way the link flow steps can be looked at without two devices, so a
 * story that silently renders nothing would hand back a blank page instead of a screen to work on.
 */
describe.each([
  ['ImportAccount', importAccount],
  ['ImportAccountConnecting', connecting],
  ['ImportAccountLock', lock],
  ['ImportAccountTransferInProgress', transfer],
  ['ImportAccountConfirmation', confirmation],
])('%s stories', (_name, storyModule) => {
  const stories = composeStories(storyModule as never) as unknown as Record<string, ComponentType>

  it.each(Object.keys(stories))('%s renders something', (storyName) => {
    const Story = stories[storyName]
    const { container } = render(<Story />)
    expect(container.textContent).not.toBe('')
  })
})
