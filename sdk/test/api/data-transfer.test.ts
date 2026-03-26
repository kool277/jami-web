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
import { DataTransferApi } from '../../src/api/data-transfer.js'
import { createMockHttpClient } from '../helpers.js'
import type { HttpClient } from '../../src/http.js'

describe('DataTransferApi', () => {
  let http: HttpClient
  let api: DataTransferApi

  beforeEach(() => {
    http = createMockHttpClient()
    api = new DataTransferApi(http)
  })

  it('getAutoDownloadLimit() should GET /data/autoDownloadLimit', async () => {
    vi.mocked(http.get).mockResolvedValue({ limit: 1048576 })
    const result = await api.getAutoDownloadLimit()
    expect(http.get).toHaveBeenCalledWith('/data/autoDownloadLimit')
    expect(result).toEqual({ limit: 1048576 })
  })

  it('getFiles() should GET conversations files', async () => {
    vi.mocked(http.get).mockResolvedValue([{ name: 'file.txt' }])
    const result = await api.getFiles('conv1')
    expect(http.get).toHaveBeenCalledWith('/conversations/conv1/files')
    expect(result).toHaveLength(1)
  })

  it('isDownloaded() should GET isDownloaded endpoint', async () => {
    vi.mocked(http.get).mockResolvedValue(true)
    const result = await api.isDownloaded('conv1', 'int1', 'file1')
    expect(http.get).toHaveBeenCalledWith('/data/conv1/int1/file1/isDownloaded')
    expect(result).toBe(true)
  })

  it('isDownloaded() should encode all path segments', async () => {
    vi.mocked(http.get).mockResolvedValue(false)
    await api.isDownloaded('a/b', 'c/d', 'e/f')
    expect(http.get).toHaveBeenCalledWith('/data/a%2Fb/c%2Fd/e%2Ff/isDownloaded')
  })

  it('getDownloadUrl() should return correct path', () => {
    const url = api.getDownloadUrl('conv1', 'int1', 'file1')
    expect(url).toBe('/data/conv1/int1/file1')
  })

  it('getDownloadUrl() should encode path segments', () => {
    const url = api.getDownloadUrl('a/b', 'c/d', 'e/f')
    expect(url).toBe('/data/a%2Fb/c%2Fd/e%2Ff')
  })
})
