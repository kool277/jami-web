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

import { vi } from 'vitest'
import type { HttpClient } from '../src/http.js'

/**
 * Creates a mock Response object for use with fetch mocking.
 */
export function mockResponse(body: unknown, init?: { status?: number; statusText?: string }): Response {
  const status = init?.status ?? 200
  const bodyStr = body !== undefined && body !== null ? JSON.stringify(body) : ''
  return new Response(bodyStr, {
    status,
    statusText: init?.statusText ?? 'OK',
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Creates a mock Response for 204 No Content.
 */
export function mockNoContent(): Response {
  return new Response(null, { status: 204, statusText: 'No Content' })
}

/**
 * Creates a mock error Response.
 */
export function mockErrorResponse(status: number, message: string): Response {
  return new Response(message, {
    status,
    statusText: 'Error',
    headers: { 'Content-Type': 'text/plain' },
  })
}

/**
 * Creates a mock HttpClient whose methods are all vi.fn() stubs.
 * Use mockResolvedValue / mockResolvedValueOnce to set return values.
 */
export function createMockHttpClient(): HttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    head: vi.fn(),
  } as unknown as HttpClient
}
