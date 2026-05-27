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
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import svgr from 'vite-plugin-svgr'
import * as topLevelAwait from 'vite-plugin-top-level-await'

type TopLevelAwaitOptions = {
  promiseExportName?: string
  promiseImportName?: (i: number) => string
}

const topLevelAwaitPlugin = topLevelAwait.default as unknown as (options?: TopLevelAwaitOptions) => Plugin

export default defineConfig({
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/styled', '@mui/material/Tooltip'],
  },
  plugins: [
    react(),
    svgr(),
    topLevelAwaitPlugin({
      promiseExportName: '__tla',
      promiseImportName: (i) => `__tla_${i}`,
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  preview: {
    port: 8080,
  },
  build: {
    outDir: '../server/client/dist',
    emptyOutDir: true,
    target: ['chrome117', 'edge121', 'firefox121', 'safari17'],
  },
  define: {
    global: {},
  },
})
