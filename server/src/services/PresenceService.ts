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

import { Container, Service } from 'typedi'

import { Jamid } from '../jamid/jamid.js'

@Service()
export class PresenceService {
  private activeSubscribers: Map<string, Set<string>> = new Map()
  private jamid: Jamid | undefined = undefined

  getJamid() {
    if (!this.jamid) {
      this.jamid = Container.get(Jamid)
    }
    return this.jamid
  }

  subscribe(accountId: string, buddyUri: string) {
    const set = this.activeSubscribers.get(accountId)
    if (set?.has(buddyUri)) {
      return
    }
    if (!set) {
      this.activeSubscribers.set(accountId, new Set([buddyUri]))
    } else {
      set.add(buddyUri)
    }
    this.getJamid().subscribeBuddy(accountId, buddyUri, true)
  }

  unsubscribeAll(accountId: string) {
    const set = this.activeSubscribers.get(accountId)
    if (!set) {
      return
    }
    for (const uri of set) {
      this.getJamid().subscribeBuddy(accountId, uri, false)
    }
    this.activeSubscribers.delete(accountId)
  }

  unsubscribe(accountId: string, buddyUri: string) {
    const set = this.activeSubscribers.get(accountId)
    if (!set?.has(buddyUri)) {
      return
    }
    set.delete(buddyUri)
    this.getJamid().subscribeBuddy(accountId, buddyUri, false)
  }
}
