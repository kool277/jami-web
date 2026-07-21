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
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chmod, mkdir, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const SERVICE_NAME = 'jami-web.service'
const LAUNCH_AGENT_LABEL = 'net.jami.web'

function systemdQuote(value: string): string {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('%', '%%')}"`
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function renderSystemdUnit(nodePath: string, cliPath: string): string {
  return `[Unit]
Description=Jami Web
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${systemdQuote(nodePath)} ${systemdQuote(cliPath)} start
Environment=NODE_ENV=production
Restart=on-failure
RestartSec=10

[Install]
WantedBy=default.target
`
}

export function renderLaunchAgent(nodePath: string, cliPath: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LAUNCH_AGENT_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${escapeXml(nodePath)}</string>
    <string>${escapeXml(cliPath)}</string>
    <string>start</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>NODE_ENV</key>
    <string>production</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key>
    <false/>
  </dict>
</dict>
</plist>
`
}

async function installSystemdService(nodePath: string, cliPath: string): Promise<string> {
  const servicePath = join(homedir(), '.config', 'systemd', 'user', SERVICE_NAME)
  await mkdir(dirname(servicePath), { recursive: true })
  await writeFile(servicePath, renderSystemdUnit(nodePath, cliPath), { mode: 0o644 })
  await chmod(servicePath, 0o644)

  try {
    await execFileAsync('systemctl', ['--user', 'daemon-reload'])
    await execFileAsync('systemctl', ['--user', 'enable', '--now', SERVICE_NAME])
  } catch (error) {
    throw new Error(`Failed to enable the systemd user service: ${(error as Error).message}`, {
      cause: error,
    })
  }

  return servicePath
}

async function uninstallSystemdService(): Promise<boolean> {
  const servicePath = join(homedir(), '.config', 'systemd', 'user', SERVICE_NAME)

  try {
    await execFileAsync('systemctl', ['--user', 'disable', '--now', SERVICE_NAME])
  } catch (error) {
    if (existsSync(servicePath)) {
      throw new Error(`Failed to remove the systemd user service: ${(error as Error).message}`, {
        cause: error,
      })
    }

    try {
      const { stdout } = await execFileAsync('systemctl', [
        '--user',
        'show',
        '--property=LoadState',
        '--value',
        SERVICE_NAME,
      ])
      if (stdout.trim() === 'not-found') {
        return false
      }

      await execFileAsync('systemctl', ['--user', 'stop', SERVICE_NAME])
      await execFileAsync('systemctl', ['--user', 'daemon-reload'])
      return true
    } catch (recoveryError) {
      throw new Error(`Failed to remove the systemd user service: ${(recoveryError as Error).message}`, {
        cause: recoveryError,
      })
    }
  }

  if (existsSync(servicePath)) {
    await rm(servicePath)
  }
  await execFileAsync('systemctl', ['--user', 'daemon-reload'])

  return true
}

interface CommandError extends Error {
  code?: number | string
}

async function isLaunchAgentLoaded(target: string): Promise<boolean> {
  try {
    await execFileAsync('launchctl', ['print', target])
    return true
  } catch (error) {
    if ((error as CommandError).code === 113) {
      return false
    }
    throw error
  }
}

async function installLaunchAgent(nodePath: string, cliPath: string): Promise<string> {
  const uid = process.getuid?.()
  if (uid === undefined) {
    throw new Error('Unable to determine the current user ID.')
  }

  const launchAgentPath = join(homedir(), 'Library', 'LaunchAgents', `${LAUNCH_AGENT_LABEL}.plist`)
  const domain = `gui/${uid}`
  const target = `${domain}/${LAUNCH_AGENT_LABEL}`

  await mkdir(dirname(launchAgentPath), { recursive: true })
  await writeFile(launchAgentPath, renderLaunchAgent(nodePath, cliPath), { mode: 0o644 })
  await chmod(launchAgentPath, 0o644)

  try {
    if (await isLaunchAgentLoaded(target)) {
      await execFileAsync('launchctl', ['bootout', target])
    }
    await execFileAsync('launchctl', ['bootstrap', domain, launchAgentPath])
    await execFileAsync('launchctl', ['enable', target])
    await execFileAsync('launchctl', ['kickstart', '-k', target])
  } catch (error) {
    throw new Error(`Failed to enable the launch agent: ${(error as Error).message}`, {
      cause: error,
    })
  }

  return launchAgentPath
}

async function uninstallLaunchAgent(): Promise<boolean> {
  const uid = process.getuid?.()
  if (uid === undefined) {
    throw new Error('Unable to determine the current user ID.')
  }

  const launchAgentPath = join(homedir(), 'Library', 'LaunchAgents', `${LAUNCH_AGENT_LABEL}.plist`)
  const target = `gui/${uid}/${LAUNCH_AGENT_LABEL}`
  const exists = existsSync(launchAgentPath)

  try {
    const loaded = await isLaunchAgentLoaded(target)
    if (loaded) {
      await execFileAsync('launchctl', ['bootout', target])
    }
    if (exists) {
      await rm(launchAgentPath)
    }
    return exists || loaded
  } catch (error) {
    throw new Error(`Failed to remove the launch agent: ${(error as Error).message}`, {
      cause: error,
    })
  }
}

export async function installCommand(args: string[]): Promise<void> {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: jami-web install

Install Jami Web as a per-user startup service and start it immediately.
Uses a systemd user service on Linux and a LaunchAgent on macOS.

Options:
  --help      Show this help message`)
    return
  }

  if (args.length > 0) {
    throw new Error(`Unknown option: ${args[0]}`)
  }

  const nodePath = resolve(process.execPath)
  const cliPath = resolve(process.argv[1])
  let servicePath: string

  if (process.platform === 'linux') {
    servicePath = await installSystemdService(nodePath, cliPath)
  } else if (process.platform === 'darwin') {
    servicePath = await installLaunchAgent(nodePath, cliPath)
  } else {
    throw new Error(`Startup installation is not supported on ${process.platform}.`)
  }

  console.log('Jami Web is installed and running as a startup service.')
  console.log(`  Service definition: ${servicePath}`)
}

export async function uninstallCommand(args: string[]): Promise<void> {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: jami-web uninstall

Stop and remove the current user's Jami Web startup service.

Options:
  --help      Show this help message`)
    return
  }

  if (args.length > 0) {
    throw new Error(`Unknown option: ${args[0]}`)
  }

  let removed: boolean
  if (process.platform === 'linux') {
    removed = await uninstallSystemdService()
  } else if (process.platform === 'darwin') {
    removed = await uninstallLaunchAgent()
  } else {
    throw new Error(`Startup installation is not supported on ${process.platform}.`)
  }

  console.log(removed ? 'Jami Web startup service removed.' : 'Jami Web startup service is not installed.')
}
