/*
 * Copyright (C) 2022-2025 Savoir-faire Linux Inc.
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
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'

import envPaths from 'env-paths'
import { Service } from 'typedi'

const paths = envPaths('jami-web', { suffix: '' })

if (!existsSync(paths.data)) {
  mkdirSync(paths.data, { recursive: true })
}

interface AccountsFormat {
  local: Record<string, { password: string; accountId: string }>
  jams: Record<string, { password: string; accountId: string }>
  guest: Record<string, string> // key is accountId, value is expiration date
  openid: Record<
    string,
    {
      accountId: string
      service: string[]
    }
  >
}

const METHODS = ['local', 'jams', 'guest', 'openid']

@Service()
export class Accounts {
  private readonly filename = paths.data + '/accounts.json'
  private accounts: AccountsFormat
  private accountsIds: Set<string>

  constructor() {
    let buffer: Buffer
    try {
      buffer = readFileSync(this.filename)
    } catch (e) {
      buffer = Buffer.from('{"local":{},"jams":{}, "guest":{}, "openid":{}}')
    }
    this.accounts = JSON.parse(buffer.toString())

    this.accountsIds = new Set<string>()
    // add the accountIds to the set
    for (const accId of Object.keys(this.accounts.guest)) {
      this.accountsIds.add(accId)
    }
    for (const key of Object.keys(this.accounts.jams)) {
      this.accountsIds.add(this.accounts.jams[key].accountId)
    }
    for (const key of Object.keys(this.accounts.local)) {
      this.accountsIds.add(this.accounts.local[key].accountId)
    }
    for (const key of Object.keys(this.accounts.openid)) {
      this.accountsIds.add(this.accounts.openid[key].accountId)
    }
  }

  get(username: string, authMethod: string = 'local') {
    if (!METHODS.includes(authMethod)) {
      console.log('Invalid auth method')
      return
    }
    if (!(authMethod in this.accounts)) {
      this.accounts[authMethod as keyof AccountsFormat] = {}
    }
    return this.accounts[authMethod as keyof AccountsFormat][username.toLowerCase()]
  }

  getOpenIdAccount(key: string) {
    return this.accounts['openid'][key.toLowerCase()]
  }

  isInJamsAccounts(username: string) {
    return username.toLowerCase() in this.accounts['jams']
  }

  set(username: string, value: string | string[], authMethod: string = 'local', accountId: string): void {
    if (!METHODS.includes(authMethod)) {
      console.log('Invalid auth method')
      return
    }

    if (!(authMethod in this.accounts)) {
      this.accounts[authMethod as keyof AccountsFormat] = {}
    }

    try {
      switch (authMethod) {
        case 'jams':
          if (accountId !== undefined && typeof value === 'string') {
            this.accounts['jams'][username.toLowerCase()] = {
              password: value,
              accountId: accountId,
            }
          } else {
            throw new Error('JAMSAccountId is required for jams auth method')
          }
          break
        case 'local':
          if (typeof value !== 'string') {
            return
          }
          this.accounts['local'][username.toLowerCase()] = {
            password: value,
            accountId: accountId,
          }
          break
        case 'guest':
          if (typeof value !== 'string') {
            return
          }
          this.accounts['guest'][username.toLowerCase()] = value
          break
        case 'openid':
          if (typeof value === 'string') {
            return
          }
          this.accounts['openid'][username.toLowerCase()] = {
            service: value,
            accountId: accountId,
          }

          break
        default:
          throw new Error('Invalid auth method')
      }
      this.accountsIds.add(accountId)
    } catch (e) {
      console.log(e)
    }
  }

  getAll(): AccountsFormat {
    return this.accounts
  }

  remove(username: string, authMethod: string) {
    if (!METHODS.includes(authMethod)) {
      console.log('Invalid auth method')
      return
    }
    if (!(authMethod in this.accounts)) {
      this.accounts[authMethod as keyof AccountsFormat] = {}
      return
    }

    const account = this.accounts[authMethod as keyof AccountsFormat][username.toLowerCase()]
    if (typeof account !== 'string') {
      this.accountsIds.delete(account.accountId)
    } else {
      // guest removal
      this.accountsIds.delete(username)
    }

    delete this.accounts[authMethod as keyof AccountsFormat][username.toLowerCase()]
  }

  extendSessionIfGuest(accountId: string) {
    if (!(accountId in this.accounts.guest)) {
      return
    }
    const guestExpiration = this.accounts.guest[accountId]
    if (guestExpiration === undefined) {
      return
    }
    const expiration = new Date(guestExpiration)
    expiration.setHours(expiration.getHours() + 2)
  }

  getGuests() {
    return this.accounts.guest
  }

  isValidAccountId(accountId: string) {
    return this.accountsIds.has(accountId)
  }

  async save(): Promise<void> {
    await writeFile(this.filename, JSON.stringify(this.accounts, null, 2) + '\n')
  }
}
