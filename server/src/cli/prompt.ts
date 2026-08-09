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
import { createInterface, Interface } from 'node:readline'

let rl: Interface | undefined

function getReadline(): Interface {
  if (!rl) {
    rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }
  return rl
}

export function closePrompt(): void {
  if (rl) {
    rl.close()
    rl = undefined
  }
}

export function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    getReadline().question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

export async function promptPassword(question: string): Promise<string> {
  // Read raw input alone so readline cannot echo password characters.
  closePrompt()
  return new Promise((resolve) => {
    // Disable echoing by intercepting keypress
    const stdin = process.stdin
    const wasRaw = stdin.isRaw
    if (stdin.isTTY) {
      stdin.setRawMode(true)
    }

    let password = ''
    process.stdout.write(question)

    const onData = (char: Buffer) => {
      const c = char.toString('utf8')
      if (c === '\n' || c === '\r' || c === '\u0004') {
        if (stdin.isTTY) {
          stdin.setRawMode(wasRaw ?? false)
        }
        stdin.removeListener('data', onData)
        process.stdout.write('\n')
        resolve(password)
      } else if (c === '\u0003') {
        // Ctrl+C
        process.exit(1)
      } else if (c === '\u007F' || c === '\b') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1)
        }
      } else {
        password += c
      }
    }

    stdin.resume()
    stdin.on('data', onData)
  })
}

export async function confirm(question: string, defaultValue = false): Promise<boolean> {
  const hint = defaultValue ? '[Y/n]' : '[y/N]'
  const answer = await prompt(`${question} ${hint} `)
  if (answer === '') return defaultValue
  return answer.toLowerCase().startsWith('y')
}

export async function choose(question: string, options: string[], defaultIndex = 0): Promise<number> {
  console.log(question)
  for (let i = 0; i < options.length; i++) {
    const marker = i === defaultIndex ? '>' : ' '
    console.log(`  ${marker} ${i + 1}) ${options[i]}`)
  }
  const answer = await prompt(`Choice [${defaultIndex + 1}]: `)
  if (answer === '') return defaultIndex
  const parsed = parseInt(answer, 10)
  if (isNaN(parsed) || parsed < 1 || parsed > options.length) {
    console.log('Invalid choice, using default.')
    return defaultIndex
  }
  return parsed - 1
}
