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
import { afterEach, describe, it, mock } from 'node:test'

const createInterface = mock.fn()

mock.module('node:readline', {
  namedExports: {
    createInterface,
  },
})

describe('promptPassword', () => {
  afterEach(() => {
    mock.restoreAll()
  })

  it('reads passwords without attaching readline echo handling', async () => {
    const { promptPassword } = await import(`./prompt.ts?case=${Date.now()}-${Math.random()}`)
    let onData: ((char: Buffer) => void) | undefined
    mock.method(process.stdin, 'on', ((event: string | symbol, listener: (char: Buffer) => void) => {
      if (event === 'data') {
        onData = listener
      }
      return process.stdin
    }) as typeof process.stdin.on)

    const passwordPromise = promptPassword('Password: ')
    if (!onData) {
      throw new Error('Expected password prompt to listen for input')
    }
    for (const character of 'hidden-password\r') {
      onData(Buffer.from(character))
    }

    assert.equal(await passwordPromise, 'hidden-password')
    assert.equal(createInterface.mock.callCount(), 0)
  })
})
