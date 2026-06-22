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
import 'reflect-metadata'

import { existsSync, mkdirSync } from 'node:fs'
import { parseArgs } from 'node:util'

import { AccountDetails } from 'jami-web-common'
import { Container } from 'typedi'

import { Jamid } from '../jamid/jamid.js'
import { RegistrationState } from '../jamid/state-enums.js'
import { ApiTokenStore } from '../storage/api-tokens.js'
import { dataDir, loadEnv } from '../utils/env.js'
import { choose, closePrompt, prompt } from './prompt.js'

let jamid: Jamid | undefined

async function initJamid(): Promise<void> {
  if (!jamid) {
    jamid = Container.get(Jamid)
  }
}

interface BotOptions {
  displayName?: string
  owner?: string
}

interface BotParseResult extends BotOptions {
  help: boolean
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
  --displayName, -n <name>  Bot display name (required; prompted when omitted)
  --owner, -o <account>      Owner account ID, hash, registered name, or display name (prompted when omitted)
  --help                     Show this help message`)
}

/**
 * Parse the arguments passed into the create-bot cli's `create-bot` command
 * @param args - The arguments to parse
 * @returns The arguments provided as a BotOptions object
 */
function parseBotArgs(args: string[]): BotParseResult {
  try {
    const { values } = parseArgs({
      args,
      allowPositionals: false,
      strict: true,
      options: {
        help: {
          type: 'boolean',
          short: 'h',
        },
        displayName: {
          type: 'string',
          short: 'n',
        },
        owner: {
          type: 'string',
          short: 'o',
        },
      },
    })

    return {
      help: values.help ?? false,
      displayName: values.displayName,
      owner: values.owner,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    printUsage()
    process.exit(1)
  }
}

/**
 * Resolve the display name for the bot
 * @param options - The bot options provided by the user
 * @returns The display name, limited to 50 characters (empty string allowed)
 */
async function resolveDisplayName(options: BotOptions): Promise<string> {
  let displayName = options.displayName?.trim() ?? ''
  const maxLength = 50

  // If provided via CLI args, warn and trim to maxLength if needed
  if (displayName) {
    if (displayName.length > maxLength) {
      console.log(`Display name will be trimmed to ${maxLength} characters (you provided ${displayName.length}).`)
      displayName = displayName.substring(0, maxLength)
    }
    return displayName
  }

  if (!process.stdin.isTTY) {
    console.error('Display name is required. Use --displayName <name>.')
    process.exit(1)
  }

  while (true) {
    displayName = (await prompt('Bot display name (max 50 characters): ')).trim()
    if (!displayName) {
      console.log('Display name is required.')
      continue
    }
    if (displayName.length > maxLength) {
      console.log(
        `Display name must be ${maxLength} characters or less (you entered ${displayName.length}). Please try again.`,
      )
      continue
    }
    break
  }
  return displayName
}

/**
 * Converts the account associated with an account ID to an OwnerAccount object
 * @param accountId - The account ID of the account to convert
 * @returns The account as an OwnerAccount object
 */
function toOwnerAccount(accountId: string): OwnerAccount | null {
  if (!jamid) throw new Error('Jamid not initialized')
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

/**
 * Returns a string formatted version of the OwnerAccount object
 * @param account - The OwnerAccount to format
 * @returns The OwnerAccount in a friendly string representation
 */
function formatOwner(account: OwnerAccount): string {
  const names = [account.displayName, account.registeredName].filter((value) => value && value !== 'undefined')
  const label = names.length > 0 ? `${names.join(' / ')} - ` : ''
  return `${label}${account.hash} (${account.accountId})`
}

/**
 * Return the associated owner account given the owners account ID
 * @param accounts - A list of potential
 * @param owner - The owner's account ID
 * @returns The OwnerAccount object associated with the given account ID
 */
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

/**
 * Resolves the account owner for the bot
 * @param options - The bot options provided by the user
 * @returns The resolved owner account, or null if no accounts are available
 */
async function resolveOwner(options: BotOptions): Promise<OwnerAccount | null> {
  if (!jamid) throw new Error('Jamid not initialized')
  const accounts = jamid
    .getAccountIds()
    .map((accountId) => toOwnerAccount(accountId))
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

/**
 * Retrieve the bot account's hash
 * @param details - The AccountDetails of which to retrieve the bot's hash
 * @returns The bot account's hash
 */
function getBotHash(details: AccountDetails): string | undefined {
  const hash = details['Account.username']
  return hash && hash !== 'undefined' ? hash : undefined
}

export async function createBotCommand(args: string[]): Promise<void> {
  const options = parseBotArgs(args)
  if (options.help) {
    printUsage()
    return
  }

  loadEnv()
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  try {
    await initJamid()
    if (!jamid) throw new Error('Jamid not initialized')

    // Determine which existing account should own the bot
    const owner = await resolveOwner(options)
    if (!owner) {
      return
    }

    // Determine the bot's display name
    const displayName = await resolveDisplayName(options)

    // Get the registration state of the bot account
    const registration = await jamid.addAccount({ 'Account.displayName': displayName })

    // If the account (bot) failed to create we remove it to avoid dead accounts
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

    // If the bot account failed to create we should delete it
    if (!botHash) {
      jamid.removeAccount(registration.accountId)
      throw new Error('The Jami bot account was created, but its hash could not be read')
    }

    // Create a token assocaited with the bot account so user's can access it via API
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
    console.log('COPY THIS API TOKEN NOW. It will only be shown once:')
    console.log(token)
  } finally {
    closePrompt()
    try {
      jamid?.stop()
    } catch {
      // Ignore errors during shutdown
    }
    process.exit(0)
  }
}
