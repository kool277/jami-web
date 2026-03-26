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

import type { ContactDetails } from 'jami-web-common'

import type { HttpClient } from '../http.js'

export class ContactApi {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<ContactDetails[]> {
    return this.http.get<ContactDetails[]>('/contacts')
  }

  async get(contactId: string): Promise<ContactDetails> {
    return this.http.get<ContactDetails>(`/contacts/${encodeURIComponent(contactId)}`)
  }

  async add(contactId: string): Promise<ContactDetails> {
    return this.http.put<ContactDetails>(`/contacts/${encodeURIComponent(contactId)}`)
  }

  async remove(contactId: string): Promise<void> {
    return this.http.delete(`/contacts/${encodeURIComponent(contactId)}`)
  }

  async block(contactId: string): Promise<void> {
    return this.http.post(`/contacts/${encodeURIComponent(contactId)}/block`)
  }

  getProfilePictureUrl(contactUri: string): string {
    return `/contacts/${encodeURIComponent(contactUri)}/profile/picture`
  }
}
