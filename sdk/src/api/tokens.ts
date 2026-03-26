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

import type { ApiTokenInfo, CreateTokenRequest, CreateTokenResponse } from '../auth.js'
import type { HttpClient } from '../http.js'

export class TokenApi {
  constructor(private readonly http: HttpClient) {}

  async create(request: CreateTokenRequest): Promise<CreateTokenResponse> {
    return this.http.post<CreateTokenResponse>('/tokens', request)
  }

  async list(): Promise<ApiTokenInfo[]> {
    return this.http.get<ApiTokenInfo[]>('/tokens')
  }

  async revoke(tokenId: string): Promise<void> {
    return this.http.delete(`/tokens/${encodeURIComponent(tokenId)}`)
  }
}
