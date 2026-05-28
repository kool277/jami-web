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
import { accessSync, constants, existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { resolve } from 'node:path'

import { IAdminAccount } from 'jami-web-common'

import { dataDir, defaultEnvPath } from '../utils/env.js'

type CheckStatus = 'ok' | 'warn' | 'fail'

interface CheckResult {
  name: string
  status: CheckStatus
  detail: string
  hint?: string
}

function envFilePath(): string {
  return process.env.JAMI_WEB_ENV_FILE ? resolve(process.env.JAMI_WEB_ENV_FILE) : defaultEnvPath
}

function checkDataDirectory(): CheckResult {
  const name = 'Data directory'
  if (!existsSync(dataDir)) {
    return {
      name,
      status: 'warn',
      detail: `${dataDir} does not exist yet`,
      hint: 'Run "jami-web setup" to create it, or it will be created on first start.',
    }
  }
  try {
    accessSync(dataDir, constants.W_OK)
    return { name, status: 'ok', detail: dataDir }
  } catch {
    return {
      name,
      status: 'fail',
      detail: `${dataDir} is not writable`,
      hint: 'Ensure the user running jami-web owns the data directory and can write to it.',
    }
  }
}

function checkSigningKeys(): CheckResult {
  const name = 'JWT signing keys'
  if (process.env.PRIVATE_KEY && process.env.PUBLIC_KEY) {
    return { name, status: 'ok', detail: 'provided via environment variables' }
  }
  const envPath = envFilePath()
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8')
    if (content.includes('PRIVATE_KEY=') && content.includes('PUBLIC_KEY=')) {
      return { name, status: 'ok', detail: envPath }
    }
  }
  return {
    name,
    status: 'fail',
    detail: `no signing keys found in ${envPath}`,
    hint: 'Run "jami-web genkeys" (or "jami-web setup") to generate them.',
  }
}

function checkAdminAccount(): CheckResult {
  const name = 'Admin account'
  const filename = dataDir + '/admin.json'
  if (!existsSync(filename)) {
    return {
      name,
      status: 'warn',
      detail: 'no admin account configured',
      hint: 'Run "jami-web setup" or create one from the web UI on first launch.',
    }
  }
  try {
    const account = JSON.parse(readFileSync(filename, 'utf-8')) as IAdminAccount
    if (account.admin) {
      return { name, status: 'ok', detail: filename }
    }
    return {
      name,
      status: 'warn',
      detail: 'admin.json exists but no admin password is set',
      hint: 'Run "jami-web setup" or create an admin from the web UI.',
    }
  } catch {
    return {
      name,
      status: 'fail',
      detail: `${filename} is corrupted or unreadable`,
      hint: 'Fix or remove the file, then run "jami-web setup".',
    }
  }
}

async function checkNativeModule(): Promise<CheckResult> {
  const name = 'Jami daemon module'
  try {
    const { loadNativeModule } = await import('../jamid/jami-swig.js')
    loadNativeModule()
    return { name, status: 'ok', detail: 'loaded successfully' }
  } catch (err) {
    const platform = `${process.platform}-${process.arch}`
    return {
      name,
      status: 'fail',
      detail: `failed to load native module for ${platform}: ${(err as Error).message}`,
      hint: `Ensure "@savoirfairelinux/jami-core-${platform}" is installed for your platform.`,
    }
  }
}

function resolvePort(): number {
  const isDev = process.env.NODE_ENV === 'development'
  const defaultPort = isDev ? 5002 : 8080
  return process.env.PORT ? Number.parseInt(process.env.PORT, 10) : defaultPort
}

function checkPort(): Promise<CheckResult> {
  const name = 'Server port'
  const port = resolvePort()
  const host = process.env.HOST

  if (Number.isNaN(port)) {
    return Promise.resolve({
      name,
      status: 'fail',
      detail: `invalid PORT value: ${process.env.PORT}`,
      hint: 'Set PORT to a valid number.',
    })
  }

  return new Promise((resolvePromise) => {
    const tester = createServer()
    tester.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolvePromise({
          name,
          status: 'fail',
          detail: `port ${port} is already in use`,
          hint: 'Stop the process using the port or set a different PORT.',
        })
      } else if (err.code === 'EACCES') {
        resolvePromise({
          name,
          status: 'warn',
          detail: `port ${port} requires elevated privileges`,
          hint: 'Use a port >= 1024 or run behind a reverse proxy.',
        })
      } else {
        resolvePromise({ name, status: 'warn', detail: `could not test port ${port}: ${err.message}` })
      }
    })
    tester.once('listening', () => {
      tester.close(() => resolvePromise({ name, status: 'ok', detail: `port ${port} is available` }))
    })
    tester.listen(port, host)
  })
}

const STATUS_MARK: Record<CheckStatus, string> = {
  ok: '✓',
  warn: '!',
  fail: '✗',
}

export async function doctorCommand(args: string[]): Promise<void> {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: jami-web doctor

Run health checks on the Jami Web installation and configuration.
Reports the data directory, signing keys, admin account, native daemon
module, and server port availability.

Exit code is non-zero if any check fails.

Options:
  --help      Show this help message`)
    return
  }

  console.log('Jami Web — Health Check')
  console.log(`  Data directory: ${dataDir}`)
  console.log(`  Env file:       ${envFilePath()}`)
  console.log(`  Environment:    ${process.env.NODE_ENV || 'production'}`)
  console.log()

  const results: CheckResult[] = [
    checkDataDirectory(),
    checkSigningKeys(),
    checkAdminAccount(),
    await checkNativeModule(),
    await checkPort(),
  ]

  for (const result of results) {
    console.log(`${STATUS_MARK[result.status]} ${result.name}: ${result.detail}`)
    if (result.hint && result.status !== 'ok') {
      console.log(`    → ${result.hint}`)
    }
  }

  console.log()
  const failed = results.filter((r) => r.status === 'fail').length
  const warned = results.filter((r) => r.status === 'warn').length
  if (failed > 0) {
    console.log(`${failed} check(s) failed, ${warned} warning(s).`)
    process.exit(1)
  } else if (warned > 0) {
    console.log(`All critical checks passed, ${warned} warning(s).`)
  } else {
    console.log('All checks passed.')
  }
}
