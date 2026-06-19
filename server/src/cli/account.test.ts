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
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it, mock } from 'node:test'

type ExitError = Error & { code?: number; isProcessExit?: boolean }

interface CreateJamidCallState {
  addAccountDetails?: Record<string, string>
  stopCalls: number
}

interface ListJamidCallState {
  stopCalls: number
}

interface DeleteJamidCallState {
  removedAccountIds: string[]
  stopCalls: number
}

function makeExitError(code: number): ExitError {
  const error = new Error(`process.exit(${code})`) as ExitError
  error.code = code
  error.isProcessExit = true
  return error
}

function expectExitCode(error: unknown, expectedCode: number): true {
  const exitError = error as ExitError
  assert.equal(exitError.isProcessExit, true)
  assert.equal(exitError.code, expectedCode)
  return true
}

function trapProcessExit() {
  return mock.method(process, 'exit', ((code?: number) => {
    throw makeExitError(code ?? 0)
  }) as (code?: number) => never)
}

function createFakeJamidForCreate(callState: CreateJamidCallState) {
  return {
    async addAccount(details: Record<string, string>) {
      callState.addAccountDetails = details
      return {
        state: 'REGISTERED',
        accountId: 'account-1',
      }
    },
    getAccountDetails(accountId: string) {
      assert.equal(accountId, 'account-1')
      return {
        'Account.username': 'hash-account-1',
      }
    },
    removeAccount() {
      throw new Error('removeAccount should not be called in successful create flow')
    },
    stop() {
      callState.stopCalls += 1
    },
    getAccountIds() {
      return []
    },
    getVolatileAccountDetails() {
      return {}
    },
  }
}

function createFakeJamidForList(callState: ListJamidCallState) {
  return {
    getAccountIds() {
      return ['bot-account-id', 'user-account-id', 'invalid-account-id']
    },
    getAccountDetails(accountId: string) {
      if (accountId === 'bot-account-id') {
        return {
          'Account.username': 'bot-hash',
          'Account.displayName': 'Bot Account',
        }
      }
      if (accountId === 'user-account-id') {
        return {
          'Account.username': 'user-hash',
          'Account.displayName': 'User Account',
        }
      }
      return {
        'Account.displayName': 'Invalid account entry',
      }
    },
    getVolatileAccountDetails(accountId: string) {
      if (accountId === 'bot-account-id') {
        return {
          'Account.registeredName': 'bot_name',
        }
      }
      if (accountId === 'user-account-id') {
        return {
          'Account.registeredName': '',
        }
      }
      return {
        'Account.registeredName': '',
      }
    },
    stop() {
      callState.stopCalls += 1
    },
    addAccount() {
      throw new Error('addAccount should not be called by list flow')
    },
    removeAccount() {
      throw new Error('removeAccount should not be called by list flow')
    },
  }
}

function createFakeJamidForDelete(callState: DeleteJamidCallState) {
  return {
    getAccountIds() {
      return ['first-account-id', 'second-account-id']
    },
    getAccountDetails(accountId: string) {
      if (accountId === 'first-account-id') {
        return {
          'Account.username': 'first-hash',
          'Account.displayName': 'First Account',
        }
      }
      if (accountId === 'second-account-id') {
        return {
          'Account.username': 'second-hash',
          'Account.displayName': 'Second Account',
        }
      }
      return {
        'Account.username': '',
      }
    },
    getVolatileAccountDetails(accountId: string) {
      if (accountId === 'first-account-id') {
        return {
          'Account.registeredName': 'first_registered',
        }
      }
      if (accountId === 'second-account-id') {
        return {
          'Account.registeredName': 'second_registered',
        }
      }
      return {
        'Account.registeredName': '',
      }
    },
    removeAccount(accountId: string) {
      callState.removedAccountIds.push(accountId)
    },
    stop() {
      callState.stopCalls += 1
    },
    addAccount() {
      throw new Error('addAccount should not be called by delete flow')
    },
  }
}

interface SetupOptions {
  tempRoot: string
  jamidDouble: Record<string, unknown>
  accountsDouble?: Record<string, unknown>
  promptAnswers?: string[]
  promptPasswordAnswers?: string[]
  chooseIndex?: number
}

async function setupAccountModule(options: SetupOptions) {
  const {
    tempRoot,
    jamidDouble,
    accountsDouble,
    promptAnswers = [],
    promptPasswordAnswers = [],
    chooseIndex = 0,
  } = options

  const accountStorageDir = join(tempRoot, 'accounts-store')

  const callLog = {
    loadEnvCalls: 0,
    hashPasswordInputs: [] as string[],
    setCalls: [] as [string, string, string, string][],
    saveCalls: 0,
    closePromptCalls: 0,
    promptQuestions: [] as string[],
    promptPasswordQuestions: [] as string[],
    chooseCalls: [] as { question: string; choices: string[] }[],
  }

  class JamidToken {}
  class AccountsToken {}

  mock.module('typedi', {
    namedExports: {
      Container: {
        get(token: unknown) {
          if (token === JamidToken) {
            return jamidDouble
          }
          if (token === AccountsToken) {
            if (!accountsDouble) {
              throw new Error('Accounts container dependency requested but no test double was provided')
            }
            return accountsDouble
          }
          throw new Error('Unexpected Container.get token')
        },
      },
    },
  })

  mock.module('../jamid/jamid.js', {
    namedExports: {
      Jamid: JamidToken,
    },
  })

  mock.module('../storage/accounts.js', {
    namedExports: {
      Accounts: AccountsToken,
    },
  })

  mock.module('../jamid/state-enums.js', {
    namedExports: {
      RegistrationState: {
        ErrorGeneric: 'ERROR_GENERIC',
      },
    },
  })

  mock.module('../utils/env.js', {
    namedExports: {
      dataDir: accountStorageDir,
      loadEnv: () => {
        callLog.loadEnvCalls += 1
      },
    },
  })

  mock.module('../utils/password.js', {
    namedExports: {
      hashPassword: async (password: string) => {
        callLog.hashPasswordInputs.push(password)
        return `hashed:${password}`
      },
    },
  })

  mock.module('../utils/vCard.js', {
    namedExports: {
      getBotOwner: (accountId: string) => {
        if (accountId === 'bot-account-id') {
          return 'owner-hash'
        }
        return undefined
      },
    },
  })

  mock.module('./prompt.js', {
    namedExports: {
      choose: async (question: string, choices: string[]) => {
        callLog.chooseCalls.push({ question, choices })
        return chooseIndex
      },
      closePrompt: () => {
        callLog.closePromptCalls += 1
      },
      prompt: async (question: string) => {
        callLog.promptQuestions.push(question)
        return promptAnswers.shift() ?? ''
      },
      promptPassword: async (question: string) => {
        callLog.promptPasswordQuestions.push(question)
        return promptPasswordAnswers.shift() ?? ''
      },
    },
  })

  const exitTrap = trapProcessExit()

  const logs: string[] = []
  const errors: string[] = []
  mock.method(console, 'log', (...args: unknown[]) => {
    logs.push(args.map(String).join(' '))
  })
  mock.method(console, 'error', (...args: unknown[]) => {
    errors.push(args.map(String).join(' '))
  })

  if (accountsDouble) {
    const accounts = accountsDouble as {
      set: (accountHash: string, hashedPassword: string, type: string, accountId: string) => void
      save: () => Promise<void>
    }

    mock.method(accounts, 'set', (accountHash: string, hashedPassword: string, type: string, accountId: string) => {
      callLog.setCalls.push([accountHash, hashedPassword, type, accountId])
    })
    mock.method(accounts, 'save', async () => {
      callLog.saveCalls += 1
    })
  }

  const accountModule = await import(`./account.ts?case=${Date.now()}-${Math.random()}`)

  return {
    accountModule,
    accountStorageDir,
    callLog,
    logs,
    errors,
    exitTrap,
  }
}

describe('account CLI', () => {
  let tempRoot: string

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'account-cli-test-'))
  })

  afterEach(() => {
    mock.restoreAll()
    rmSync(tempRoot, { recursive: true, force: true })
  })

  it('creates an account in TTY mode through interactive prompts', async () => {
    const createCallState: CreateJamidCallState = {
      stopCalls: 0,
    }

    const { accountModule, accountStorageDir, callLog, logs } = await setupAccountModule({
      tempRoot,
      jamidDouble: createFakeJamidForCreate(createCallState),
      accountsDouble: {
        set() {
          // replaced by mock.method in setup
        },
        async save() {
          // replaced by mock.method in setup
        },
      },
      promptAnswers: ['TTY User'],
      promptPasswordAnswers: ['tty-password'],
      chooseIndex: 0,
    })

    const stdin = process.stdin as unknown as { isTTY: boolean }
    const previousIsTTY = stdin.isTTY
    stdin.isTTY = true
    try {
      await assert.rejects(
        () => accountModule.accountsCommand([]),
        (error) => expectExitCode(error, 0),
      )
    } finally {
      stdin.isTTY = previousIsTTY
    }

    assert.deepEqual(createCallState.addAccountDetails, {
      'Account.displayName': 'TTY User',
    })
    assert.deepEqual(callLog.hashPasswordInputs, ['tty-password'])
    assert.deepEqual(callLog.setCalls, [['hash-account-1', 'hashed:tty-password', 'local', 'account-1']])
    assert.equal(callLog.saveCalls, 1)
    assert.equal(callLog.closePromptCalls, 1)
    assert.equal(createCallState.stopCalls, 1)
    assert.equal(callLog.loadEnvCalls, 1)
    assert.equal(callLog.chooseCalls.length, 1)
    assert.deepEqual(callLog.promptQuestions, ['Display name (optional, max 50 characters): '])
    assert.deepEqual(callLog.promptPasswordQuestions, ['Password: '])
    assert.equal(
      logs.some((line) => line.includes('Jami account created')),
      true,
    )
    assert.equal(
      logs.some((line) => line.includes('Account hash: hash-account-1')),
      true,
    )

    assert.equal(accountStorageDir.startsWith(tempRoot), true)
  })

  it('creates an account from space-separated arguments', async () => {
    const createCallState: CreateJamidCallState = {
      stopCalls: 0,
    }

    const { accountModule, callLog } = await setupAccountModule({
      tempRoot,
      jamidDouble: createFakeJamidForCreate(createCallState),
      accountsDouble: {
        set() {
          // replaced by mock.method in setup
        },
        async save() {
          // replaced by mock.method in setup
        },
      },
    })

    await assert.rejects(
      () => accountModule.accountsCommand(['create', '--displayName', 'Space User', '--password', 'space-password']),
      (error) => expectExitCode(error, 0),
    )

    assert.deepEqual(createCallState.addAccountDetails, {
      'Account.displayName': 'Space User',
    })
    assert.deepEqual(callLog.hashPasswordInputs, ['space-password'])
    assert.deepEqual(callLog.setCalls, [['hash-account-1', 'hashed:space-password', 'local', 'account-1']])
    assert.equal(callLog.promptQuestions.length, 0)
    assert.equal(callLog.promptPasswordQuestions.length, 0)
    assert.equal(callLog.closePromptCalls, 1)
    assert.equal(createCallState.stopCalls, 1)
    assert.equal(callLog.loadEnvCalls, 1)
  })

  it('creates an account from assigned arguments', async () => {
    const createCallState: CreateJamidCallState = {
      stopCalls: 0,
    }

    const { accountModule, callLog } = await setupAccountModule({
      tempRoot,
      jamidDouble: createFakeJamidForCreate(createCallState),
      accountsDouble: {
        set() {
          // replaced by mock.method in setup
        },
        async save() {
          // replaced by mock.method in setup
        },
      },
    })

    await assert.rejects(
      () => accountModule.accountsCommand(['create', '--displayName=Assigned User', '--password=assigned-password']),
      (error) => expectExitCode(error, 0),
    )

    assert.deepEqual(createCallState.addAccountDetails, {
      'Account.displayName': 'Assigned User',
    })
    assert.deepEqual(callLog.hashPasswordInputs, ['assigned-password'])
    assert.deepEqual(callLog.setCalls, [['hash-account-1', 'hashed:assigned-password', 'local', 'account-1']])
    assert.equal(callLog.promptQuestions.length, 0)
    assert.equal(callLog.promptPasswordQuestions.length, 0)
    assert.equal(callLog.closePromptCalls, 1)
    assert.equal(createCallState.stopCalls, 1)
    assert.equal(callLog.loadEnvCalls, 1)
  })

  it('prints create-specific help for accounts create --help', async () => {
    const createCallState: CreateJamidCallState = {
      stopCalls: 0,
    }

    const { accountModule, callLog, logs } = await setupAccountModule({
      tempRoot,
      jamidDouble: createFakeJamidForCreate(createCallState),
      accountsDouble: {
        set() {
          // replaced by mock.method in setup
        },
        async save() {
          // replaced by mock.method in setup
        },
      },
    })

    await accountModule.accountsCommand(['create', '--help'])

    assert.equal(callLog.loadEnvCalls, 0)
    assert.equal(callLog.hashPasswordInputs.length, 0)
    assert.equal(callLog.setCalls.length, 0)
    assert.equal(callLog.closePromptCalls, 0)
    assert.equal(createCallState.stopCalls, 0)
    assert.equal(
      logs.some((line) => line.includes('Usage: jami-web accounts create [options]')),
      true,
    )
    assert.equal(
      logs.some((line) => line.includes('Usage: jami-web accounts <subcommand> [options]')),
      false,
    )
  })

  it('lists available accounts and bot owner information', async () => {
    const listCallState: ListJamidCallState = {
      stopCalls: 0,
    }

    const { accountModule, callLog, logs, errors } = await setupAccountModule({
      tempRoot,
      jamidDouble: createFakeJamidForList(listCallState),
    })

    await assert.rejects(
      () => accountModule.accountsCommand(['list']),
      (error) => expectExitCode(error, 0),
    )

    assert.equal(callLog.loadEnvCalls, 1)
    assert.equal(callLog.closePromptCalls, 1)
    assert.equal(listCallState.stopCalls, 1)
    assert.equal(errors.length, 0)
    assert.equal(
      logs.some((line) => line.includes('Jami accounts (2)')),
      true,
    )
    assert.equal(
      logs.some((line) => line.includes('Hash:            bot-hash')),
      true,
    )
    assert.equal(
      logs.some((line) => line.includes('Hash:            user-hash')),
      true,
    )
    assert.equal(
      logs.some((line) => line.includes('Bot owner:       owner-hash')),
      true,
    )
  })

  it('removes an account from space-separated --accountId argument', async () => {
    const deleteCallState: DeleteJamidCallState = {
      removedAccountIds: [],
      stopCalls: 0,
    }

    const { accountModule, callLog, logs } = await setupAccountModule({
      tempRoot,
      jamidDouble: createFakeJamidForDelete(deleteCallState),
    })

    await assert.rejects(
      () => accountModule.accountsCommand(['remove', '--accountId', 'second-account-id']),
      (error) => expectExitCode(error, 0),
    )

    assert.deepEqual(deleteCallState.removedAccountIds, ['second-account-id'])
    assert.equal(callLog.chooseCalls.length, 0)
    assert.equal(callLog.loadEnvCalls, 1)
    assert.equal(callLog.closePromptCalls, 1)
    assert.equal(deleteCallState.stopCalls, 1)
    assert.equal(
      logs.some((line) => line.includes('Jami account removed: second-account-id')),
      true,
    )
  })

  it('removes an account from assigned --accountId argument', async () => {
    const deleteCallState: DeleteJamidCallState = {
      removedAccountIds: [],
      stopCalls: 0,
    }

    const { accountModule, callLog } = await setupAccountModule({
      tempRoot,
      jamidDouble: createFakeJamidForDelete(deleteCallState),
    })

    await assert.rejects(
      () => accountModule.accountsCommand(['remove', '--accountId=first-account-id']),
      (error) => expectExitCode(error, 0),
    )

    assert.deepEqual(deleteCallState.removedAccountIds, ['first-account-id'])
    assert.equal(callLog.chooseCalls.length, 0)
    assert.equal(callLog.loadEnvCalls, 1)
    assert.equal(callLog.closePromptCalls, 1)
    assert.equal(deleteCallState.stopCalls, 1)
  })

  it('prompts in TTY mode when --accountId is omitted for remove', async () => {
    const deleteCallState: DeleteJamidCallState = {
      removedAccountIds: [],
      stopCalls: 0,
    }

    const { accountModule, callLog } = await setupAccountModule({
      tempRoot,
      jamidDouble: createFakeJamidForDelete(deleteCallState),
      chooseIndex: 1,
    })

    const stdin = process.stdin as unknown as { isTTY: boolean }
    const previousIsTTY = stdin.isTTY
    stdin.isTTY = true
    try {
      await assert.rejects(
        () => accountModule.accountsCommand(['remove']),
        (error) => expectExitCode(error, 0),
      )
    } finally {
      stdin.isTTY = previousIsTTY
    }

    assert.deepEqual(deleteCallState.removedAccountIds, ['second-account-id'])
    assert.equal(callLog.chooseCalls.length, 1)
    assert.equal(callLog.chooseCalls[0].question, 'Which account should be removed?')
    assert.equal(callLog.loadEnvCalls, 1)
    assert.equal(callLog.closePromptCalls, 1)
    assert.equal(deleteCallState.stopCalls, 1)
  })
})
