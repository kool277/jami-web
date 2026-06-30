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
import { existsSync, mkdirSync } from 'node:fs'

import { AccountDetails } from 'jami-web-common'

import { dataDir, loadEnv } from '../utils/env.js'
import { choose, closePrompt, prompt } from './prompt.js'

interface BotOptions {
  displayName?: string
  owner?: string
}

interface OwnerAccount {
  accountId: string
  hash: string
  displayName: string
  registeredName: string
}

function printUsage() {
  console.log(`Usage: jami-web bot [options]

Create a Jami bot account without registering a username, attach it to an owner account,
generate an API token, and save the token metadata to api-tokens.json.

Options:
  --display-name, -n <name>  Bot display name (required; prompted when omitted)
  --owner, -o <account>      Owner account ID, hash, registered name, or display name (prompted when omitted)
  --help                     Show this help message`)
}

function readOptionValue(args: string[], index: number, option: string): string {
  const value = args[index + 1]
  if (!value || value.startsWith('-')) {
    console.error(`Missing value for ${option}`)
    process.exit(1)
  }
  return value
}

function parseBotArgs(args: string[]): BotOptions {
  const options: BotOptions = {}
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--display-name' || arg === '-n') {
      options.displayName = readOptionValue(args, index, arg)
      index++
      continue
    }
    if (arg === '--owner' || arg === '-o') {
      options.owner = readOptionValue(args, index, arg)
      index++
      continue
    }
    if (arg.startsWith('--display-name=')) {
      options.displayName = arg.substring('--display-name='.length)
      continue
    }
    if (arg.startsWith('--owner=')) {
      options.owner = arg.substring('--owner='.length)
      continue
    }

    console.error(`Unknown option: ${arg}`)
    printUsage()
    process.exit(1)
  }
  return options
}

async function resolveDisplayName(options: BotOptions): Promise<string> {
  let displayName = options.displayName?.trim() ?? ''
  while (!displayName) {
    if (!process.stdin.isTTY) {
      console.error('Display name is required. Use --display-name <name>.')
      process.exit(1)
    }
    displayName = await prompt('Bot display name: ')
    if (!displayName) {
      console.log('Display name is required.')
    }
  }
  return displayName
}

function toOwnerAccount(jamid: import('../jamid/jamid.js').Jamid, accountId: string): OwnerAccount | null {
  const details = jamid.getAccountDetails(accountId)
  const hash = details['Account.username']
  if (!hash) {
    return null
  }

  let registeredName = ''
  try {
    registeredName = jamid.getVolatileAccountDetails(accountId)['Account.registeredName'] ?? ''
  } catch {
    registeredName = ''
  }

  return {
    accountId,
    hash,
    displayName: details['Account.displayName'] ?? '',
    registeredName,
  }
}

function formatOwner(account: OwnerAccount): string {
  const names = [account.displayName, account.registeredName].filter((value) => value && value !== 'undefined')
  const label = names.length > 0 ? `${names.join(' / ')} - ` : ''
  return `${label}${account.hash} (${account.accountId})`
}

function findOwner(accounts: OwnerAccount[], owner: string): OwnerAccount | undefined {
  const normalizedOwner = owner.toLowerCase()
  return accounts.find((account) => {
    return (
      account.accountId.toLowerCase() === normalizedOwner ||
      account.hash.toLowerCase() === normalizedOwner ||
      account.displayName.toLowerCase() === normalizedOwner ||
      account.registeredName.toLowerCase() === normalizedOwner
    )
  })
}

async function resolveOwner(
  jamid: import('../jamid/jamid.js').Jamid,
  options: BotOptions,
): Promise<OwnerAccount | null> {
  const accounts = jamid
    .getAccountIds()
    .map((accountId) => toOwnerAccount(jamid, accountId))
    .filter((account): account is OwnerAccount => account !== null)

  if (accounts.length === 0) {
    console.log('No Jami accounts are available. Create an account first, then run this command again.')
    return null
  }

  if (options.owner) {
    const owner = findOwner(accounts, options.owner.trim())
    if (!owner) {
      console.error(`Owner account not found: ${options.owner}`)
      process.exit(1)
    }
    return owner
  }

  if (!process.stdin.isTTY) {
    console.error('Owner account is required. Use --owner <account>.')
    process.exit(1)
  }

  const selectedIndex = await choose(
    'Which account should own this bot?',
    accounts.map((account) => formatOwner(account)),
  )
  return accounts[selectedIndex]
}

function getBotHash(details: AccountDetails): string | undefined {
  const hash = details['Account.username']
  return hash && hash !== 'undefined' ? hash : undefined
}

export async function createBotCommand(args: string[]): Promise<void> {
  if (args.includes('--help') || args.includes('-h')) {
    printUsage()
    return
  }

  loadEnv()
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  const options = parseBotArgs(args)
  let jamid: import('../jamid/jamid.js').Jamid | undefined
  let commandError: unknown
  try {
    await import('reflect-metadata')
    const { Container } = await import('typedi')
    const { Jamid } = await import('../jamid/jamid.js')
    const { RegistrationState } = await import('../jamid/state-enums.js')
    const { ApiTokenStore } = await import('../storage/api-tokens.js')

    jamid = Container.get(Jamid)
    const owner = await resolveOwner(jamid, options)
    if (!owner) {
      return
    }

    const displayName = await resolveDisplayName(options)
    const registration = await jamid.addAccount({ 'Account.displayName': displayName })

    if (registration.state === RegistrationState.ErrorGeneric) {
      jamid.removeAccount(registration.accountId)
      throw new Error('Failed to create the Jami bot account')
    }

    let botHash: string | undefined
    try {
      jamid.updateProfile(registration.accountId, displayName, '', '', owner.hash, 10)
      const details = jamid.getAccountDetails(registration.accountId)
      botHash = getBotHash(details)
    } catch (err) {
      jamid.removeAccount(registration.accountId)
      throw err
    }

    if (!botHash) {
      jamid.removeAccount(registration.accountId)
      throw new Error('The Jami bot account was created, but its hash could not be read')
    }

    const tokenStore = Container.get(ApiTokenStore)
    const { token, info } = tokenStore.createToken(registration.accountId, displayName)
    await tokenStore.save()

    console.log('Jami bot created')
    console.log(`  Display name: ${displayName}`)
    console.log(`  Owner hash:   ${owner.hash}`)
    console.log(`  Account ID:   ${registration.accountId}`)
    console.log(`  Bot hash:     ${botHash}`)
    console.log(`  Token ID:     ${info.id}`)
    console.log(`  Token prefix: ${info.prefix}`)
    console.log()
    console.log('Presence: restart any running Jami Web server so it loads this bot account and publishes it online.')
    console.log()
    console.log('Copy this API token now. It will only be shown once:')
    console.log(token)
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
