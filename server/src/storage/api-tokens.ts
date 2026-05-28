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
import { createHash, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'

import { Service } from 'typedi'

import { dataDir } from '../utils/env.js'

const _TOKEN_SCOPES = [
  'conversations:read',
  'conversations:write',
  'contacts:read',
  'contacts:write',
  'calls:read',
  'calls:write',
  'files:read',
  'files:write',
  'account:read',
  'account:write',
] as const

export type TokenScope = (typeof _TOKEN_SCOPES)[number]

export interface StoredApiToken {
  id: string
  hash: string
  prefix: string
  accountId: string
  scopes: TokenScope[]
  name: string
  createdAt: string
  expiresAt?: string
  lastUsedAt?: string
}

export interface ApiTokenInfo {
  id: string
  prefix: string
  accountId: string
  scopes: TokenScope[]
  name: string
  createdAt: string
  expiresAt?: string
  lastUsedAt?: string
}

interface TokenStoreFormat {
  tokens: StoredApiToken[]
}

@Service()
export class ApiTokenStore {
  private readonly filename = dataDir + '/api-tokens.json'
  private store: TokenStoreFormat

  constructor() {
    try {
      const buffer = readFileSync(this.filename)
      this.store = JSON.parse(buffer.toString())
    } catch {
      this.store = { tokens: [] }
    }
  }

  createToken(
    accountId: string,
    name: string,
    scopes?: TokenScope[],
    expiresIn?: string,
  ): { token: string; info: ApiTokenInfo } {
    const rawToken = randomBytes(32).toString('hex')
    const prefix = `jm_sk_${rawToken.slice(0, 8)}`
    const fullToken = `jm_sk_${rawToken}`
    const hash = createHash('sha256').update(fullToken).digest('hex')

    let expiresAt: string | undefined
    if (expiresIn) {
      const ms = parseDuration(expiresIn)
      if (ms > 0) {
        expiresAt = new Date(Date.now() + ms).toISOString()
      }
    }

    const stored: StoredApiToken = {
      id: randomBytes(16).toString('hex'),
      hash,
      prefix,
      accountId,
      scopes: scopes && scopes.length > 0 ? scopes : [],
      name,
      createdAt: new Date().toISOString(),
      expiresAt,
    }

    this.store.tokens.push(stored)

    const info: ApiTokenInfo = {
      id: stored.id,
      prefix: stored.prefix,
      accountId: stored.accountId,
      scopes: stored.scopes,
      name: stored.name,
      createdAt: stored.createdAt,
      expiresAt: stored.expiresAt,
    }

    return { token: fullToken, info }
  }

  validateToken(token: string): { accountId: string; scopes: TokenScope[] } | null {
    const hash = createHash('sha256').update(token).digest('hex')
    const stored = this.store.tokens.find((t) => t.hash === hash)
    if (!stored) return null

    if (stored.expiresAt && new Date(stored.expiresAt) < new Date()) {
      return null
    }

    stored.lastUsedAt = new Date().toISOString()

    return { accountId: stored.accountId, scopes: stored.scopes }
  }

  listTokens(accountId: string): ApiTokenInfo[] {
    return this.store.tokens.filter((t) => t.accountId === accountId).map(({ hash: _hash, ...info }) => info)
  }

  revokeToken(tokenId: string, accountId: string): boolean {
    const idx = this.store.tokens.findIndex((t) => t.id === tokenId && t.accountId === accountId)
    if (idx === -1) return false
    this.store.tokens.splice(idx, 1)
    return true
  }

  async save(): Promise<void> {
    await writeFile(this.filename, JSON.stringify(this.store, null, 2) + '\n')
  }
}

function parseDuration(s: string): number {
  const match = s.match(/^(\d+)(s|m|h|d)$/)
  if (!match) return 0
  const value = parseInt(match[1], 10)
  switch (match[2]) {
    case 's':
      return value * 1000
    case 'm':
      return value * 60 * 1000
    case 'h':
      return value * 3600 * 1000
    case 'd':
      return value * 86400 * 1000
    default:
      return 0
  }
}
