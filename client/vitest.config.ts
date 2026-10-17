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
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Node.js 25 and later define a localStorage of their own, undefined unless
// --localstorage-file is given. Vitest keeps the globals Node.js already
// has, so that one hides jsdom's localStorage: turn it off in the workers.
const nodeWebStorageFlags = process.allowedNodeEnvironmentFlags.has('--experimental-webstorage')
  ? ['--no-experimental-webstorage']
  : []

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    execArgv: nodeWebStorageFlags,
    setupFiles: ['./src/test/setup.ts', './.storybook/vitest.setup.ts'],
  },
})
