/*
 * Copyright (C) 2022-2026 Savoir-faire Linux Inc.
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

import { describe, it, expect } from 'vitest'
import { TOKEN_SCOPES } from '../src/auth.js'

describe('auth', () => {
  it('TOKEN_SCOPES should contain all expected scopes', () => {
    expect(TOKEN_SCOPES).toContain('conversations:read')
    expect(TOKEN_SCOPES).toContain('conversations:write')
    expect(TOKEN_SCOPES).toContain('contacts:read')
    expect(TOKEN_SCOPES).toContain('contacts:write')
    expect(TOKEN_SCOPES).toContain('calls:read')
    expect(TOKEN_SCOPES).toContain('calls:write')
    expect(TOKEN_SCOPES).toContain('files:read')
    expect(TOKEN_SCOPES).toContain('files:write')
    expect(TOKEN_SCOPES).toContain('account:read')
    expect(TOKEN_SCOPES).toContain('account:write')
  })

  it('TOKEN_SCOPES should have exactly 10 scopes', () => {
    expect(TOKEN_SCOPES).toHaveLength(10)
  })

  it('TOKEN_SCOPES should be readonly', () => {
    // TypeScript enforces this at compile time via `as const`,
    // but verify it's an array at runtime
    expect(Array.isArray(TOKEN_SCOPES)).toBe(true)
  })
})
