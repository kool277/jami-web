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

import type { IContact } from 'jami-web-common'

import type { HttpClient } from '../http.js'

export interface AccountInfo {
  id: string
  uri: string
  registeredName: string
  details: Record<string, string>
  volatileDetails: Record<string, string>
  defaultModerators: string[]
  devices: Record<string, string>
}

export class AccountApi {
  constructor(private readonly http: HttpClient) {}

  async get(): Promise<AccountInfo> {
    const raw = await this.http.get<AccountInfo>('/account')
    raw.uri = raw.details?.['Account.username'] ?? ''
    raw.registeredName = raw.volatileDetails?.['Account.registeredName'] ?? ''
    return raw
  }

  async update(details: Record<string, string>): Promise<void> {
    return this.http.patch('/account', details)
  }

  async setDisplayName(displayName: string): Promise<void> {
    return this.http.post('/account/displayName', { displayName })
  }

  async resetDisplayName(): Promise<void> {
    return this.http.post('/account/displayName/reset')
  }

  async revokeDevice(deviceId: string, password: string): Promise<void> {
    return this.http.post(`/account/${encodeURIComponent(deviceId)}/revoke`, { password })
  }

  async addDevice(uri: string): Promise<void> {
    return this.http.post('/account/addDevice', { uri })
  }

  async confirmDevice(opId: number): Promise<void> {
    return this.http.post(`/account/${encodeURIComponent(String(opId))}/confirmDevice`)
  }

  async cancelDevice(opId: number): Promise<void> {
    return this.http.post(`/account/${encodeURIComponent(String(opId))}/cancelDevice`)
  }

  async lookupUsername(username: string): Promise<{ state: number; address: string; name: string }> {
    return this.http.get(`/ns/name/${encodeURIComponent(username)}`)
  }

  async lookupAddress(address: string): Promise<{ state: number; address: string; name: string }> {
    return this.http.get(`/ns/address/${encodeURIComponent(address)}`)
  }

  async checkUsernameAvailability(username: string): Promise<number> {
    return this.http.head(`/ns/name/${encodeURIComponent(username)}`)
  }

  async getDefaultModerators(): Promise<IContact[]> {
    return this.http.get<IContact[]>('/default-moderators')
  }

  async addDefaultModerator(contactId: string): Promise<void> {
    return this.http.put(`/default-moderators/${encodeURIComponent(contactId)}`)
  }

  async removeDefaultModerator(contactId: string): Promise<void> {
    return this.http.delete(`/default-moderators/${encodeURIComponent(contactId)}`)
  }
}
