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

import type { HttpClient } from '../http.js'

export class DataTransferApi {
  constructor(private readonly http: HttpClient) {}

  async getAutoDownloadLimit(): Promise<{ limit: number }> {
    return this.http.get<{ limit: number }>('/data/autoDownloadLimit')
  }

  async getFiles(conversationId: string): Promise<unknown[]> {
    return this.http.get<unknown[]>(`/conversations/${encodeURIComponent(conversationId)}/files`)
  }

  async isDownloaded(conversationId: string, interactionId: string, fileId: string): Promise<boolean> {
    return this.http.get<boolean>(
      `/data/${encodeURIComponent(conversationId)}/${encodeURIComponent(interactionId)}/${encodeURIComponent(fileId)}/isDownloaded`,
    )
  }

  getDownloadUrl(conversationId: string, interactionId: string, fileId: string): string {
    return `/data/${encodeURIComponent(conversationId)}/${encodeURIComponent(interactionId)}/${encodeURIComponent(fileId)}`
  }

  async downloadFile(
    conversationId: string,
    interactionId: string,
    fileId: string,
  ): Promise<{ data: ArrayBuffer; contentType: string }> {
    const path = this.getDownloadUrl(conversationId, interactionId, fileId)
    const res = await this.http.fetchRaw(path)
    const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
    const data = await res.arrayBuffer()
    return { data, contentType }
  }
}
