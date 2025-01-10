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
import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'

import { OpenIdAccount } from 'jami-web-common'
import { Service } from 'typedi'

interface AccountsFormat {
  local: Record<string, string>
  jams: Record<string, { password: string; accountId: string }>
  guest: Record<string, string>
  openid: Record<string, OpenIdAccount>
}

const METHODS = ['local', 'jams', 'guest', 'openid']

@Service()
export class Accounts {
  private readonly filename = 'accounts.json'
  private accounts: AccountsFormat

  constructor() {
    let buffer: Buffer
    try {
      buffer = readFileSync(this.filename)
    } catch (e) {
      buffer = Buffer.from('{"local":{},"jams":{}, "guest":{}, "openid":{}}')
    }
    this.accounts = JSON.parse(buffer.toString())
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

  getOpenIdAccount(email: string) {
    return this.accounts['openid'][email.toLowerCase()]
  }

  isInJamsAccounts(username: string) {
    return username.toLowerCase() in this.accounts['jams']
  }

  set(username: string, value: string | OpenIdAccount, authMethod: string = 'local', JAMSAccountId?: string): void {
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
          if (JAMSAccountId !== undefined && typeof value === 'string') {
            this.accounts['jams'][username.toLowerCase()] = {
              password: value,
              accountId: JAMSAccountId,
            }
          } else {
            throw new Error('JAMSAccountId is required for jams auth method')
          }
          break
        case 'local':
          if (typeof value !== 'string') {
            return
          }
          this.accounts['local'][username.toLowerCase()] = value
          break
        // TODO : Add support for guest and openid
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
          this.accounts['openid'][username.toLowerCase()] = value
          break
        default:
          throw new Error('Invalid auth method')
      }
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

    delete this.accounts[authMethod as keyof AccountsFormat][username.toLowerCase()]
  }

  extendSessionIfGuest(username: string) {
    const guestExpiration = this.accounts.guest[username]
    if (guestExpiration === undefined) {
      return
    }
    const expiration = new Date(guestExpiration)
    expiration.setHours(expiration.getHours() + 2)
  }

  getGuests() {
    return this.accounts.guest
  }

  async save(): Promise<void> {
    await writeFile(this.filename, JSON.stringify(this.accounts, null, 2) + '\n')
  }
}
