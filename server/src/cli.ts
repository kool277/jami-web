#!/usr/bin/env node
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
import { configCommand } from './cli/config.js'
import { genkeyCommand } from './cli/genkeys.js'
import { setupCommand } from './cli/setup.js'

const args = process.argv.slice(2)
const command = args[0]

function printUsage() {
  console.log(`Usage: jami-web <command> [options]

Commands:
  setup       Interactive setup wizard (create admin account and configure server)
  genkeys     Generate JWT signing keys and write them to .env
  config      Show or update server configuration
  start       Start the Jami Web server

Options:
  --help      Show this help message

Run 'jami-web <command> --help' for more information on a command.`)
}

async function main() {
  if (!command || command === '--help' || command === '-h') {
    printUsage()
    process.exit(0)
  }

  switch (command) {
    case 'setup':
      await setupCommand(args.slice(1))
      break
    case 'genkeys':
      await genkeyCommand(args.slice(1))
      break
    case 'config':
      await configCommand(args.slice(1))
      break
    case 'start': {
      // Dynamically import the server entry point
      await import('./index.js')
      break
    }
    default:
      console.error(`Unknown command: ${command}`)
      printUsage()
      process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
