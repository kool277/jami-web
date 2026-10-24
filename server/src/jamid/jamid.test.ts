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
let nextAccountId = 'account-1'
let conversationMembers: Record<string, { uri: string; role: string }[]> = {}

class MockStringMap {
  private entries = new Map<string, string>()
  set(key: string, value: string) {
    this.entries.set(key, value)
  }
}

const jamiSwig = {
  init: (handlers: SignalHandlers) => {
    signalHandlers = handlers
  },
  getAccountDetails: (accountId: string) => {
    accountDetailsCalls.push(accountId)
    return { 'Account.username': `uri-of-${accountId}` }
  },
  StringMap: MockStringMap,
  getConversationMembers: (_accountId: string, conversationId: string) => conversationMembers[conversationId] ?? [],
  addAccount: () => nextAccountId,
  monitor: () => undefined,
  fini: () => undefined,
}

mock.module('@savoirfairelinux/jami-core', {
  namedExports: {
    JamiSignal: { VolatileDetailsChanged: 'VolatileDetailsChanged', DeviceAuthStateChanged: 'DeviceAuthStateChanged' },
    loadNativeModule: () => jamiSwig,
    stringMapToRecord: (value: unknown) => value,
    stringVectToArray: (value: unknown) => value,
    vectMapToRecordArray: (value: unknown) => value,
  },
})

interface DeviceAuthStateChanged {
  accountId: string
  state: number
  details: Record<string, string>
}

let jamid: {
  isUriAlreadyImported(uri: string): boolean
  getAccountIdFromUsername(username: string): string | undefined
  getLinkToken(): Promise<DeviceAuthStateChanged>
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

describe('Jamid.getLinkToken', () => {
  it('resolves with the token of the account it created', async () => {
    nextAccountId = 'linking-account'
    const pending = jamid.getLinkToken()

    signalHandlers.DeviceAuthStateChanged('linking-account', 1, { token: 'jami-auth://token' })

    const values = await pending
    assert.equal(values.accountId, 'linking-account')
    assert.deepEqual(values.details, { token: 'jami-auth://token' })
  })

  it('ignores events belonging to another linking account', async () => {
    nextAccountId = 'mine'
    const pending = jamid.getLinkToken()

    // A concurrent link on another account must not hand its token to this caller.
    signalHandlers.DeviceAuthStateChanged('someone-else', 1, { token: 'jami-auth://theirs' })
    signalHandlers.DeviceAuthStateChanged('mine', 1, { token: 'jami-auth://mine' })

    const values = await pending
    assert.equal(values.accountId, 'mine')
    assert.deepEqual(values.details, { token: 'jami-auth://mine' })
  })
})

describe('Jamid account messages from peers', () => {
  const ALICE = 'a'.repeat(40)
  const MALLORY = 'b'.repeat(40)
  const message = (type: string, data: Record<string, unknown>) => ({
    'application/json': JSON.stringify({ type, data }),
  })
  const offer = { conversationId: 'conversation', senderId: ALICE, sdp: { type: 'offer', sdp: 'v=0' } }

  let sent: unknown[][]
  let parseCallMessage: (signal: { accountId: string; from: string; payload: Record<string, string> }) => unknown

  before(async () => {
    const specifier = './jamid.js?jamid-account-messages-test'
    const module = (await import(specifier)) as {
      Jamid: new (...args: unknown[]) => unknown
      parseCallMessage: typeof parseCallMessage
    }
    parseCallMessage = module.parseCallMessage
    new module.Jamid(
      { send: (...args: unknown[]) => sent.push(args) },
      { getConfig: () => ({ noLocalMediaEnabled: false }) },
    )
  })

  beforeEach(() => {
    sent = []
    conversationMembers = { conversation: [{ uri: ALICE, role: 'member' }] }
  })

  it('gives the call message of a member to the browser', async () => {
    signalHandlers.IncomingAccountMessage('account-1', ALICE, message('onWebRtcDescription', offer))
    await setImmediateAsync()

    assert.deepEqual(sent, [['account-1', 'onWebRtcDescription', offer]])
  })

  it('drops a message from someone who is not a member of the conversation', async () => {
    conversationMembers = { conversation: [{ uri: ALICE, role: 'banned' }] }
    signalHandlers.IncomingAccountMessage('account-1', ALICE, message('onWebRtcDescription', offer))
    await setImmediateAsync()

    assert.deepEqual(sent, [])
  })

  it('drops a message that claims another sender than the one that sent it', () => {
    const forged = { accountId: 'account-1', from: MALLORY, payload: message('onWebRtcDescription', offer) }
    assert.equal(parseCallMessage(forged), undefined)
  })

  it('cannot check the sender with a daemon binding that passes the message ID', () => {
    const signal = { accountId: 'account-1', from: '', payload: message('onCallInvite', offer) }
    assert.notEqual(parseCallMessage(signal), undefined)
  })

  it('drops anything but call messages, without throwing', async () => {
    const payloads = [
      { 'application/json': 'not json' },
      { 'text/plain': 'hello' },
      message('AccountDetails', { conversationId: 'conversation', senderId: ALICE }),
      message('onCallInvite', { senderId: ALICE }),
      { 'application/json': 'null' },
    ]
    for (const payload of payloads) {
      signalHandlers.IncomingAccountMessage('account-1', ALICE, payload)
    }
    await setImmediateAsync()

    assert.deepEqual(sent, [])
  })
})
