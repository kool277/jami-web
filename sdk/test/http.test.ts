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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HttpClient, HttpError } from '../src/http.js'
import { mockResponse, mockNoContent, mockErrorResponse } from './helpers.js'

describe('HttpError', () => {
  it('should store status and message', () => {
    const err = new HttpError(404, 'Not found')
    expect(err.status).toBe(404)
    expect(err.message).toBe('Not found')
    expect(err.name).toBe('HttpError')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('HttpClient', () => {
  let client: HttpClient
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    client = new HttpClient({
      baseUrl: 'https://example.com/api/',
      getToken: () => 'test-token',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should strip trailing slashes from baseUrl', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ ok: true }))
    await client.get('/test')
    expect(fetchSpy).toHaveBeenCalledWith('https://example.com/api/test', expect.objectContaining({ method: 'GET' }))
  })

  it('should include Authorization header with bearer token', async () => {
    fetchSpy.mockResolvedValue(mockResponse({ ok: true }))
    await client.get('/test')
    const [, init] = fetchSpy.mock.calls[0]
    expect(init.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      }),
    )
  })

  it('should resolve async token providers', async () => {
    const asyncClient = new HttpClient({
      baseUrl: 'https://example.com/api',
      getToken: async () => 'async-token',
    })
    fetchSpy.mockResolvedValue(mockResponse({}))
    await asyncClient.get('/test')
    const [, init] = fetchSpy.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer async-token')
  })

  describe('GET', () => {
    it('should return parsed JSON', async () => {
      const data = { id: '123', name: 'test' }
      fetchSpy.mockResolvedValue(mockResponse(data))
      const result = await client.get('/items')
      expect(result).toEqual(data)
    })

    it('should return undefined on 204', async () => {
      fetchSpy.mockResolvedValue(mockNoContent())
      const result = await client.get('/empty')
      expect(result).toBeUndefined()
    })

    it('should throw HttpError on failure', async () => {
      fetchSpy.mockResolvedValue(mockErrorResponse(403, 'Forbidden'))
      const err = await client.get('/secret').catch((e: unknown) => e)
      expect(err).toBeInstanceOf(HttpError)
      expect(err).toMatchObject({
        status: 403,
        message: 'Forbidden',
      })
    })
  })

  describe('POST', () => {
    it('should send JSON body', async () => {
      fetchSpy.mockResolvedValue(mockResponse({ id: '1' }))
      await client.post('/items', { name: 'new' })
      const [, init] = fetchSpy.mock.calls[0]
      expect(init.method).toBe('POST')
      expect(init.body).toBe(JSON.stringify({ name: 'new' }))
    })

    it('should handle no body', async () => {
      fetchSpy.mockResolvedValue(mockResponse({ ok: true }))
      await client.post('/action')
      const [, init] = fetchSpy.mock.calls[0]
      expect(init.body).toBeUndefined()
    })

    it('should return undefined on 204', async () => {
      fetchSpy.mockResolvedValue(mockNoContent())
      const result = await client.post('/action')
      expect(result).toBeUndefined()
    })

    it('should return undefined on empty body', async () => {
      fetchSpy.mockResolvedValue(new Response('', { status: 200 }))
      const result = await client.post('/action')
      expect(result).toBeUndefined()
    })

    it('should throw HttpError on failure', async () => {
      fetchSpy.mockResolvedValue(mockErrorResponse(400, 'Bad Request'))
      await expect(client.post('/items', {})).rejects.toThrow(HttpError)
    })
  })

  describe('PATCH', () => {
    it('should send PATCH with body', async () => {
      fetchSpy.mockResolvedValue(mockResponse({ updated: true }))
      await client.patch('/items/1', { name: 'updated' })
      const [url, init] = fetchSpy.mock.calls[0]
      expect(url).toBe('https://example.com/api/items/1')
      expect(init.method).toBe('PATCH')
      expect(init.body).toBe(JSON.stringify({ name: 'updated' }))
    })

    it('should throw HttpError on failure', async () => {
      fetchSpy.mockResolvedValue(mockErrorResponse(500, 'Internal Server Error'))
      await expect(client.patch('/items/1', {})).rejects.toThrow(HttpError)
    })
  })

  describe('PUT', () => {
    it('should send PUT with body', async () => {
      fetchSpy.mockResolvedValue(mockResponse({ created: true }))
      await client.put('/items/1', { name: 'upserted' })
      const [, init] = fetchSpy.mock.calls[0]
      expect(init.method).toBe('PUT')
      expect(init.body).toBe(JSON.stringify({ name: 'upserted' }))
    })

    it('should handle PUT without body', async () => {
      fetchSpy.mockResolvedValue(mockNoContent())
      const result = await client.put('/items/1')
      expect(result).toBeUndefined()
    })
  })

  describe('DELETE', () => {
    it('should send DELETE request', async () => {
      fetchSpy.mockResolvedValue(new Response(null, { status: 204 }))
      await client.delete('/items/1')
      const [url, init] = fetchSpy.mock.calls[0]
      expect(url).toBe('https://example.com/api/items/1')
      expect(init.method).toBe('DELETE')
    })

    it('should throw HttpError on failure', async () => {
      fetchSpy.mockResolvedValue(mockErrorResponse(404, 'Not Found'))
      await expect(client.delete('/items/999')).rejects.toThrow(HttpError)
    })
  })
})
