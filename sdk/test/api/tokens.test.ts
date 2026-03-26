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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TokenApi } from '../../src/api/tokens.js'
import { createMockHttpClient } from '../helpers.js'
import type { HttpClient } from '../../src/http.js'

describe('TokenApi', () => {
  let http: HttpClient
  let api: TokenApi

  beforeEach(() => {
    http = createMockHttpClient()
    api = new TokenApi(http)
  })

  it('create() should POST /tokens with request body', async () => {
    const response = {
      token: 'jm_sk_abc123',
      info: { id: 't1', prefix: 'jm_sk_abc', accountId: 'a1', scopes: [], name: 'test', createdAt: '' },
    }
    vi.mocked(http.post).mockResolvedValue(response)
    const result = await api.create({ name: 'my-bot', scopes: ['conversations:read'], expiresIn: '30d' })
    expect(http.post).toHaveBeenCalledWith('/tokens', {
      name: 'my-bot',
      scopes: ['conversations:read'],
      expiresIn: '30d',
    })
    expect(result).toEqual(response)
  })

  it('create() should work with minimal request', async () => {
    vi.mocked(http.post).mockResolvedValue({ token: 'tok', info: {} })
    await api.create({ name: 'simple' })
    expect(http.post).toHaveBeenCalledWith('/tokens', { name: 'simple' })
  })

  it('list() should GET /tokens', async () => {
    const tokens = [
      { id: 't1', name: 'token1' },
      { id: 't2', name: 'token2' },
    ]
    vi.mocked(http.get).mockResolvedValue(tokens)
    const result = await api.list()
    expect(http.get).toHaveBeenCalledWith('/tokens')
    expect(result).toEqual(tokens)
  })

  it('revoke() should DELETE /tokens/:id', async () => {
    vi.mocked(http.delete).mockResolvedValue(undefined)
    await api.revoke('token-123')
    expect(http.delete).toHaveBeenCalledWith('/tokens/token-123')
  })

  it('revoke() should encode tokenId', async () => {
    vi.mocked(http.delete).mockResolvedValue(undefined)
    await api.revoke('tok/en')
    expect(http.delete).toHaveBeenCalledWith('/tokens/tok%2Fen')
  })
})
