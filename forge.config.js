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
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { VitePlugin } from '@electron-forge/plugin-vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = __dirname

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
export default {
  packagerConfig: {
    // Keep the package unarchived so the Express server (a forked
    // utility process relying on ESM and native Node addons) can read
    // its own files directly from disk at runtime.
    asar: false,
    name: 'Jami',
    appBundleId: 'net.jami.web',
    // Use a function-based ignore so the Forge Vite plugin's auto-ignore
    // is bypassed and we control exactly what enters the package.
    // Files NOT matching any keep-rule are excluded.
    ignore: (filePath) => {
      // electron-packager passes an empty string for the root itself — keep it
      if (!filePath) return false

      // Compiled Electron main process and preload (from Vite plugin)
      if (filePath.startsWith('/.vite')) return false

      // Electron needs package.json to find the main entry point
      if (filePath === '/package.json') return false

      // All runtime dependencies: server, client, and common workspace packages
      // are resolved from here at runtime.
      // NOTE: the full node_modules (including devDeps) ends up here for now;
      //       a production-only npm install can be added as an optimisation.
      if (filePath.startsWith('/node_modules')) return false

      // server/ and client/ are added by the packageAfterCopy hook below
      return true
    },
  },

  rebuildConfig: {},

  makers: [
    // macOS: ZIP archive (universal distributable)
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    // Windows: Squirrel installer
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    // Linux: .deb package
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    // Linux: .rpm package
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],

  plugins: [
    new VitePlugin({
      // Build the Electron main process and preload script with Vite.
      // Output goes to .vite/build/ (required by the Forge Vite plugin).
      build: [
        {
          entry: 'electron/main.ts',
          config: 'electron/vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'electron/preload.ts',
          config: 'electron/vite.preload.config.ts',
          target: 'preload',
        },
      ],
      // No Vite-managed renderer: the Express server serves the React app.
      renderer: [],
    }),
  ],

  hooks: {
    /**
     * After the Forge Vite plugin copies the minimal app skeleton (.vite/build/,
     * node_modules/, package.json) into buildPath, we add the Express server
     * distribution and the pre-built React client.
     *
     * Path layout inside buildPath (= Resources/app/ in the final .app):
     *   .vite/build/main.js     — Electron main process
     *   .vite/build/preload.js  — contextBridge preload
     *   server/dist/index.js    — Express server (forked as utilityProcess)
     *   client/dist/index.html  — React SPA served by Express
     *
     * From .vite/build/, path.join(__dirname, '../../server') resolves to
     * Resources/app/server/, which is exactly where we put the server here.
     */
    packageAfterCopy: async (_forgeConfig, buildPath) => {
      const copy = (src, dest) => {
        if (!existsSync(src)) return
        mkdirSync(path.dirname(dest), { recursive: true })
        cpSync(src, dest, { recursive: true })
      }
      const copyFile = (src, dest) => {
        if (!existsSync(src)) return
        mkdirSync(path.dirname(dest), { recursive: true })
        copyFileSync(src, dest)
      }

      const serverSrc = path.join(PROJECT_ROOT, 'server')
      const serverDest = path.join(buildPath, 'server')

      // Compiled server (ESM — needs package.json for "type": "module")
      copy(path.join(serverSrc, 'dist'), path.join(serverDest, 'dist'))
      copyFile(path.join(serverSrc, 'package.json'), path.join(serverDest, 'package.json'))

      // Server data files referenced at startup
      for (const file of ['available_languages.json', 'openid-providers.json', 'openapi.yaml']) {
        copyFile(path.join(serverSrc, file), path.join(serverDest, file))
      }
      copy(path.join(serverSrc, 'locale'), path.join(serverDest, 'locale'))

      // Pre-built React SPA served as static files by Express in production
      copy(path.join(PROJECT_ROOT, 'client', 'dist'), path.join(buildPath, 'client', 'dist'))
    },
  },
}
