/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
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
import assert from 'node:assert/strict'
import { before, beforeEach, describe, it, mock } from 'node:test'
import { setImmediate as setImmediateAsync } from 'node:timers/promises'

type SignalHandlers = Record<string, (...args: unknown[]) => void>

let signalHandlers: SignalHandlers = {}
let accountDetailsCalls: string[] = []

const jamiSwig = {
  init: (handlers: SignalHandlers) => {
    signalHandlers = handlers
  },
  getAccountDetails: (accountId: string) => {
    accountDetailsCalls.push(accountId)
    return { 'Account.username': `uri-of-${accountId}` }
  },
  monitor: () => undefined,
  fini: () => undefined,
}

mock.module('@savoirfairelinux/jami-core', {
  namedExports: {
    JamiSignal: { VolatileDetailsChanged: 'VolatileDetailsChanged' },
    loadNativeModule: () => jamiSwig,
    stringMapToRecord: (value: unknown) => value,
    stringVectToArray: (value: unknown) => value,
    vectMapToRecordArray: (value: unknown) => value,
  },
})

let jamid: {
  isUriAlreadyImported(uri: string): boolean
  getAccountIdFromUsername(username: string): string | undefined
}

before(async () => {
  const specifier = './jamid.js?jamid-test'
  const { Jamid } = (await import(specifier)) as { Jamid: new (...args: unknown[]) => typeof jamid }
  jamid = new Jamid({ send: () => true }, { getConfig: () => ({ noLocalMediaEnabled: false }) })
})

beforeEach(async () => {
  // Flush the deferred lookups scheduled by the previous test before resetting.
  await setImmediateAsync()
  accountDetailsCalls = []
})

describe('Jamid signal handlers', () => {
  it('does not re-enter the daemon while a signal callback is running', () => {
    signalHandlers.VolatileDetailsChanged('account-1', { 'Account.registeredName': 'alice' })

    // The emitting daemon thread still holds its account lock until this callback
    // returns, so calling back into the daemon here deadlocks the whole process.
    assert.deepEqual(accountDetailsCalls, [])
  })

  it('still indexes the account uri once the signal callback has returned', async () => {
    signalHandlers.VolatileDetailsChanged('account-1', { 'Account.registeredName': 'alice' })

    await setImmediateAsync()

    assert.deepEqual(accountDetailsCalls, ['account-1'])
    assert.equal(jamid.isUriAlreadyImported('uri-of-account-1'), true)
  })

  it('indexes the registered name without touching the daemon', () => {
    signalHandlers.VolatileDetailsChanged('account-2', { 'Account.registeredName': 'bob' })

    assert.equal(jamid.getAccountIdFromUsername('bob'), 'account-2')
  })
})
