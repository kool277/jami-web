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
import { AdminWizardState, IAdminAccount, urlRegex } from 'jami-web-common'

import { hashPassword } from '../utils/password.js'
import { genkeyCommand } from './genkeys.js'
import { closePrompt, confirm, prompt, promptPassword } from './prompt.js'

const paths = envPaths('jami-web', { suffix: '' })
const MIN_ADMIN_PASSWORD_LENGTH = 8

function loadAdminAccount(filename: string): IAdminAccount {
  try {
    const buffer = readFileSync(filename)
    return JSON.parse(buffer.toString())
  } catch {
    return {} as IAdminAccount
  }
}

function initDefaults(account: IAdminAccount): IAdminAccount {
  if (!account.config) {
    account.config = {
      localAuthEnabled: true,
      jamsAuthEnabled: false,
      guestAccessEnabled: false,
      openIdAuthEnabled: false,
      uploadPath: paths.data + '/uploads/',
    }
  }
  if (account.lastWizardState === undefined) {
    account.lastWizardState = AdminWizardState.account
  }
  if (account.autoDownloadLimit === undefined) {
    account.autoDownloadLimit = 20
  }
  if (!account.openIdProviders) {
    account.openIdProviders = {}
  }
  return account
}

async function saveAdminAccount(filename: string, account: IAdminAccount): Promise<void> {
  await writeFile(filename, JSON.stringify(account, null, 2) + '\n')
}

export async function setupCommand(args: string[]): Promise<void> {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: jami-web setup [options]

Interactive setup wizard for Jami Web server.
Equivalent to the web-based admin setup wizard.

Steps:
  1. Generate JWT signing keys (if missing)
  2. Create an admin account with a password
  3. Configure authentication methods
  4. Configure the nameserver

Options:
  --help      Show this help message`)
    return
  }

  console.log('╔══════════════════════════════════════╗')
  console.log('║       Jami Web — Server Setup        ║')
  console.log('╚══════════════════════════════════════╝')
  console.log()

  // Ensure data directory exists
  if (!existsSync(paths.data)) {
    mkdirSync(paths.data, { recursive: true })
  }
  const uploadPath = paths.data + '/uploads/'
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true })
  }

  const filename = paths.data + '/admin.json'
  let account = loadAdminAccount(filename)
  account = initDefaults(account)

  console.log(`Data directory: ${paths.data}`)
  console.log()

  // Step 1: Generate signing keys
  console.log('── Step 1: JWT Signing Keys ──')
  await genkeyCommand([])
  console.log()

  // Step 2: Admin password
  console.log('── Step 2: Admin Account ──')
  const hasExistingAdmin = account.admin !== undefined
  if (hasExistingAdmin) {
    console.log('An admin account already exists.')
    const resetAdmin = await confirm('Reset admin password?', false)
    if (resetAdmin) {
      await setAdminPassword(account)
    }
  } else {
    await setAdminPassword(account)
  }
  console.log()

  // Step 3: Authentication methods
  console.log('── Step 3: Authentication ──')
  await configureAuth(account)
  console.log()

  // Step 4: Nameserver
  console.log('── Step 4: Name Server ──')
  await configureNameserver(account)
  console.log()

  // Step 5: Guest access
  console.log('── Step 5: Guest Access ──')
  account.config.guestAccessEnabled = await confirm('Enable guest access?', account.config.guestAccessEnabled)
  console.log()

  // Mark setup as complete
  account.lastWizardState = AdminWizardState.complete

  // Save
  await saveAdminAccount(filename, account)
  console.log('✓ Configuration saved to', filename)
  console.log()
  console.log('You can now start the server with:')
  console.log('  jami-web start')
  console.log()
  console.log('Or in production mode:')
  console.log('  NODE_ENV=production jami-web start')

  closePrompt()
}

async function setAdminPassword(account: IAdminAccount): Promise<void> {
  while (true) {
    const password = await promptPassword('Enter admin password (min 8 characters): ')
    if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
      console.log(`Password must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters long.`)
      continue
    }
    const passwordConfirm = await promptPassword('Confirm admin password: ')
    if (password !== passwordConfirm) {
      console.log('Passwords do not match. Please try again.')
      continue
    }
    account.admin = await hashPassword(password)
    console.log('✓ Admin password set.')
    break
  }
}

async function configureAuth(account: IAdminAccount): Promise<void> {
  // Local auth
  account.config.localAuthEnabled = await confirm('Enable local authentication?', account.config.localAuthEnabled)

  // JAMS auth
  const enableJams = await confirm('Enable JAMS authentication?', account.config.jamsAuthEnabled)
  account.config.jamsAuthEnabled = enableJams
  if (enableJams) {
    const currentUrl = account.jamsUrl || ''
    const jamsUrl = await prompt(`JAMS server URL${currentUrl ? ` [${currentUrl}]` : ''}: `)
    const finalUrl = jamsUrl || currentUrl
    if (finalUrl) {
      if (!urlRegex.test(finalUrl)) {
        console.log('Warning: URL does not look valid. Saving anyway.')
      }
      account.jamsUrl = finalUrl
    }
  }

  // OpenID — simplified; detailed per-provider config is better done via the web UI
  const enableOpenId = await confirm('Enable OpenID authentication?', account.config.openIdAuthEnabled)
  account.config.openIdAuthEnabled = enableOpenId

  console.log('✓ Authentication configured:')
  console.log(`    Local:  ${account.config.localAuthEnabled ? 'enabled' : 'disabled'}`)
  console.log(`    JAMS:   ${account.config.jamsAuthEnabled ? 'enabled' : 'disabled'}`)
  console.log(`    OpenID: ${account.config.openIdAuthEnabled ? 'enabled' : 'disabled'}`)
}

async function configureNameserver(account: IAdminAccount): Promise<void> {
  const currentNs = account.nameserver || 'https://ns.jami.net'
  const ns = await prompt(`Name server URL [${currentNs}]: `)
  const finalNs = ns || currentNs
  if (finalNs && finalNs !== 'https://ns.jami.net') {
    if (!urlRegex.test(finalNs)) {
      console.log('Warning: URL does not look valid. Saving anyway.')
    }
    account.nameserver = finalNs
  } else {
    // Default — remove override
    delete account.nameserver
  }
  console.log(`✓ Name server: ${finalNs}`)
}
