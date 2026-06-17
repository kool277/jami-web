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
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'

import { dataDir, loadEnv } from '../utils/env.js'
import { hashPassword } from '../utils/password.js'
import { closePrompt, prompt, promptPassword } from './prompt.js'

interface AccountOptions {
  displayName?: string
  password?: string
}

interface AccountListOptions {
  json: boolean
}

interface ListedAccount {
  accountId: string
  hash: string
  displayName: string
  registeredName: string
  isBot: boolean
  botOwner?: string
}

function printUsage() {
  console.log(`Usage: jami-web account [options]

Create a Jami account.

The account can be used to:
  - Login to the web client with the account hash and password
  - Register a username later through the web client or web API

Options:
  --display-name, -n <name>  Account display name (optional; prompted when omitted)
  --password, -p <password>  Account password (required; prompted when omitted)
  list                       List all Jami accounts
  --help                     Show this help message`)
}

function printListUsage() {
  console.log(`Usage: jami-web accounts [options]
       jami-web account list [options]

List all Jami accounts known to the local daemon and show whether each account is a bot.

Options:
  --json      Output accounts as JSON
  --help      Show this help message`)
}

function readOptionValue(args: string[], index: number, option: string): string {
  const value = args[index + 1]
  if (!value || value.startsWith('-')) {
    console.error(`Missing value for ${option}`)
    process.exit(1)
  }
  return value
}

function parseAccountArgs(args: string[]): AccountOptions {
  const options: AccountOptions = {}
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--display-name' || arg === '-n') {
      options.displayName = readOptionValue(args, index, arg)
      index++
      continue
    }
    if (arg === '--password' || arg === '-p') {
      options.password = readOptionValue(args, index, arg)
      index++
      continue
    }
    if (arg.startsWith('--display-name=')) {
      options.displayName = arg.substring('--display-name='.length)
      continue
    }
    if (arg.startsWith('--password=')) {
      options.password = arg.substring('--password='.length)
      continue
    }

    console.error(`Unknown option: ${arg}`)
    printUsage()
    process.exit(1)
  }
  return options
}

function parseListArgs(args: string[]): AccountListOptions {
  const options: AccountListOptions = { json: false }
  for (const arg of args) {
    if (arg === '--json') {
      options.json = true
      continue
    }
    console.error(`Unknown option: ${arg}`)
    printListUsage()
    process.exit(1)
  }
  return options
}

async function resolveDisplayName(options: AccountOptions): Promise<string> {
  let displayName = options.displayName?.trim() ?? ''
  if (!displayName) {
    if (process.stdin.isTTY) {
      displayName = (await prompt('Display name (optional): ')).trim()
    }
  }
  return displayName
}

async function resolvePassword(options: AccountOptions): Promise<string> {
  let password = options.password?.trim() ?? ''
  while (!password) {
    if (!process.stdin.isTTY) {
      console.error('Password is required. Use --password <password>.')
      process.exit(1)
    }
    password = await promptPassword('Password: ')
    if (!password) {
      console.log('Password is required.')
    }
  }
  return password
}

function jamiDataDir(): string {
  return process.env.XDG_DATA_HOME
    ? join(process.env.XDG_DATA_HOME, 'jami')
    : join(os.homedir(), '.local', 'share', 'jami')
}

function readBotProfile(accountId: string): Pick<ListedAccount, 'isBot' | 'botOwner'> {
  try {
    const content = readFileSync(join(jamiDataDir(), accountId, 'profile.vcf'), 'utf-8')
    const fields = parseVCardFields(content)
    const botOwner = fields['RELATED;TYPE=owner']?.replace(/^jami:/, '')
    return {
      isBot: fields.KIND === 'application' || botOwner !== undefined,
      botOwner,
    }
  } catch {
    return { isBot: false }
  }
}

function parseVCardFields(content: string): Record<string, string> {
  const fields: Record<string, string> = {}
  const unfoldedLines = content
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '')
    .split(/\r?\n/)
  for (const line of unfoldedLines) {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) {
      continue
    }
    const key = line.slice(0, separatorIndex)
    const value = line.slice(separatorIndex + 1)
    fields[key] = value
  }
  return fields
}

function formatOptional(value: string | undefined): string {
  return value && value !== 'undefined' ? value : '-'
}

function printAccountList(accounts: ListedAccount[]): void {
  if (accounts.length === 0) {
    console.log('No Jami accounts are available.')
    return
  }

  console.log(`Jami accounts (${accounts.length})`)
  for (const account of accounts) {
    console.log(`- ${formatOptional(account.displayName)}`)
    console.log(`  Account ID:      ${account.accountId}`)
    console.log(`  Hash:            ${account.hash}`)
    console.log(`  Registered name: ${formatOptional(account.registeredName)}`)
    console.log(`  Bot:             ${account.isBot ? 'yes' : 'no'}`)
    if (account.isBot) {
      console.log(`  Bot owner:       ${formatOptional(account.botOwner)}`)
    }
  }
}

function getListedAccounts(jamid: import('../jamid/jamid.js').Jamid): ListedAccount[] {
  return jamid
    .getAccountIds()
    .map((accountId) => {
      const details = jamid.getAccountDetails(accountId)
      const hash = details['Account.username']
      if (!hash) {
        return undefined
      }

      let registeredName = ''
      try {
        registeredName = jamid.getVolatileAccountDetails(accountId)['Account.registeredName'] ?? ''
      } catch {
        registeredName = ''
      }

      const botProfile = readBotProfile(accountId)
      return {
        accountId,
        hash,
        displayName: details['Account.displayName'] ?? '',
        registeredName,
        ...botProfile,
      }
    })
    .filter((account): account is ListedAccount => account !== undefined)
}

export async function listAccountsCommand(args: string[]): Promise<void> {
  if (args.includes('--help') || args.includes('-h')) {
    printListUsage()
    return
  }

  loadEnv()
  const options = parseListArgs(args)

  let jamid: import('../jamid/jamid.js').Jamid | undefined
  let commandError: unknown
  try {
    await import('reflect-metadata')
    const { Container } = await import('typedi')
    const { Jamid } = await import('../jamid/jamid.js')

    jamid = Container.get(Jamid)
    const accounts = getListedAccounts(jamid)
    if (options.json) {
      console.log(JSON.stringify(accounts, null, 2))
    } else {
      printAccountList(accounts)
    }
  } catch (err) {
    commandError = err
    throw err
  } finally {
    closePrompt()
    jamid?.stop()
    if (jamid && commandError === undefined) {
      process.exit(0)
    }
  }
}

export async function createAccountCommand(args: string[]): Promise<void> {
  if (args[0] === 'list' || args[0] === 'ls') {
    await listAccountsCommand(args.slice(1))
    return
  }

  if (args.includes('--help') || args.includes('-h')) {
    printUsage()
    return
  }

  loadEnv()
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  const options = parseAccountArgs(args)
  const displayName = await resolveDisplayName(options)
  const password = await resolvePassword(options)

  let jamid: import('../jamid/jamid.js').Jamid | undefined
  let commandError: unknown
  try {
    await import('reflect-metadata')
    const { Container } = await import('typedi')
    const { Jamid } = await import('../jamid/jamid.js')
    const { RegistrationState } = await import('../jamid/state-enums.js')
    const { Accounts } = await import('../storage/accounts.js')

    jamid = Container.get(Jamid)
    const accounts = Container.get(Accounts)
    const accountDetails = displayName ? { 'Account.displayName': displayName } : {}
    const registration = await jamid.addAccount(accountDetails)

    if (registration.state === RegistrationState.ErrorGeneric) {
      jamid.removeAccount(registration.accountId)
      throw new Error('Failed to create the Jami account')
    }

    const details = jamid.getAccountDetails(registration.accountId)
    const accountHash = details['Account.username']
    if (!accountHash) {
      jamid.removeAccount(registration.accountId)
      throw new Error('The Jami account was created, but its hash could not be read')
    }

    const hashedPassword = await hashPassword(password)
    accounts.set(accountHash, hashedPassword, 'local', registration.accountId)
    await accounts.save()

    console.log('Jami account created')
    if (displayName) {
      console.log(`  Display name: ${displayName}`)
    }
    console.log(`  Account ID:   ${registration.accountId}`)
    console.log(`  Account hash: ${accountHash}`)
    console.log()
    console.log('Web client login:')
    console.log(`  Account:  ${accountHash}`)
    console.log(`  Password: ${password}`)
  } catch (err) {
    commandError = err
    throw err
  } finally {
    closePrompt()
    jamid?.stop()
    if (jamid && commandError === undefined) {
      process.exit(0)
    }
  }
}
