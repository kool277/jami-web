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
import { CallApi } from '../../src/api/calls.js'
import { createMockHttpClient } from '../helpers.js'
import type { HttpClient } from '../../src/http.js'

describe('CallApi', () => {
  let http: HttpClient
  let api: CallApi

  beforeEach(() => {
    http = createMockHttpClient()
    api = new CallApi(http)
  })

  it('list() should GET /calls', async () => {
    vi.mocked(http.get).mockResolvedValue(['call-1', 'call-2'])
    const result = await api.list()
    expect(http.get).toHaveBeenCalledWith('/calls')
    expect(result).toEqual(['call-1', 'call-2'])
  })

  it('get() should GET /calls/:id', async () => {
    vi.mocked(http.get).mockResolvedValue({ state: 'CURRENT' })
    const result = await api.get('call-1')
    expect(http.get).toHaveBeenCalledWith('/calls/call-1')
    expect(result).toEqual({ state: 'CURRENT' })
  })

  it('get() should encode callId', async () => {
    vi.mocked(http.get).mockResolvedValue({})
    await api.get('call/with/slash')
    expect(http.get).toHaveBeenCalledWith('/calls/call%2Fwith%2Fslash')
  })
})
