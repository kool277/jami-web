/*
 * Copyright (C) 2022-2024 Savoir-faire Linux Inc.
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
'use strict'
import './index.scss'
import './i18n'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'

import AlertSnackbarProvider from './contexts/AlertSnackbarProvider'
import CustomThemeProvider from './contexts/CustomThemeProvider'
import NotificationsProvider from './contexts/NotificationsProvider'
import { store } from './redux/store'
import { router } from './router'

const queryClient = new QueryClient()

const container = document.getElementById('root')
if (!container) {
  throw new Error('Failed to get the root element')
}
const root = createRoot(container)
root.render(
  <Provider store={store}>
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <CustomThemeProvider>
          <NotificationsProvider>
            <AlertSnackbarProvider>
              <RouterProvider router={router} />
              {/*<ReactQueryDevtools initialIsOpen={false} />*/}
            </AlertSnackbarProvider>
          </NotificationsProvider>
        </CustomThemeProvider>
      </QueryClientProvider>
    </StrictMode>
  </Provider>,
)
