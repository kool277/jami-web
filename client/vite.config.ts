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
import { AdminWizardState, getAdminSetupRedirect } from '@savoirfairelinux/jami-web-common'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import svgr from 'vite-plugin-svgr'

const adminSetupGatePlugin = (apiOrigin: string, desktopMode: boolean): Plugin => ({
  name: 'admin-setup-gate',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (desktopMode || req.method !== 'GET' || !req.headers.accept?.includes('text/html')) {
        next()
        return
      }

      try {
        const response = await fetch(new URL('/api/admin/adminWizardState', apiOrigin))
        if (!response.ok) {
          throw new Error(`Admin wizard state request failed with status ${response.status}`)
        }

        const data = (await response.json()) as { lastWizardState?: AdminWizardState }
        const wizardState = data.lastWizardState ?? AdminWizardState.account
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
        const redirectPath = getAdminSetupRedirect(pathname, wizardState)
        if (redirectPath) {
          res.statusCode = 302
          res.setHeader('Location', redirectPath)
          res.end()
          return
        }

        next()
      } catch (error) {
        next(error)
      }
    })
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const debugDesktopMode = mode !== 'production' && process.env.JAMI_DEBUG_DESKTOP_MODE === 'true'

  return {
    optimizeDeps: {
      include: ['@emotion/react', '@emotion/styled', '@mui/material/Tooltip'],
    },
    plugins: [adminSetupGatePlugin(env.VITE_API_URL, debugDesktopMode), react(), svgr()],
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
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'admin',
                test: /client[\\/]src[\\/]admin[\\/]/,
                priority: 20,
                includeDependenciesRecursively: false,
              },
              {
                name: 'settings',
                test: /client[\\/]src[\\/]settings[\\/]/,
                priority: 20,
                includeDependenciesRecursively: false,
              },
              {
                name: 'react-vendor',
                test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
                includeDependenciesRecursively: false,
              },
              {
                name: 'ui-vendor',
                test: /node_modules[\\/](@mui|@emotion|@popperjs|material-symbols|react-transition-group)[\\/]/,
                includeDependenciesRecursively: false,
              },
            ],
          },
        },
      },
    },
    define: {
      global: {},
      __JAMI_DEBUG_DESKTOP_MODE__: JSON.stringify(debugDesktopMode),
    },
  }
})
