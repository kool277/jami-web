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

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export interface HttpClientOptions {
  baseUrl: string
  getToken: () => string | Promise<string>
}

export class HttpClient {
  private readonly baseUrl: string
  private readonly getToken: () => string | Promise<string>

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '')
    this.getToken = options.getToken
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await this.getToken()
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: await this.headers(),
    })
    if (!res.ok) throw new HttpError(res.status, await res.text())
    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: await this.headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new HttpError(res.status, await res.text())
    if (res.status === 204) return undefined as T
    const text = await res.text()
    return text ? (JSON.parse(text) as T) : (undefined as T)
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: await this.headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new HttpError(res.status, await res.text())
    if (res.status === 204) return undefined as T
    const text = await res.text()
    return text ? (JSON.parse(text) as T) : (undefined as T)
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: await this.headers(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new HttpError(res.status, await res.text())
    if (res.status === 204) return undefined as T
    const text = await res.text()
    return text ? (JSON.parse(text) as T) : (undefined as T)
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: await this.headers(),
    })
    if (!res.ok) throw new HttpError(res.status, await res.text())
  }

  async head(path: string): Promise<number> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'HEAD',
      headers: await this.headers(),
    })
    return res.status
  }

  async fetchRaw(path: string): Promise<Response> {
    const headers = await this.headers()
    delete headers['Content-Type']
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers,
    })
    if (!res.ok) throw new HttpError(res.status, await res.text())
    return res
  }
}
