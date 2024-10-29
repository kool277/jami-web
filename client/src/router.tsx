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

import { AdminSettingSelection } from 'jami-web-common'
import { createBrowserRouter, createRoutesFromElements, Outlet, Route } from 'react-router-dom'

import App, { appLoader } from './App'
import CustomizeProfile from './components/AccountSettings/CustomizeProfile'
import LinkedDevices from './components/AccountSettings/LinkedDevices'
import AccountsOverview from './components/AdminSettings/AccountsOverview'
import AdminAccountConfiguration from './components/AdminSettings/AdminAccountConfiguration'
import AdminAuthWrapper from './components/AdminSettings/AdminAuthWrapper'
import AuthMethods from './components/AdminSettings/AuthMethods'
import JamsAuthMethod from './components/AdminSettings/JamsAuthMethod'
import LocalAuthMethod from './components/AdminSettings/LocalAuthMethod'
import ContactList from './components/ContactList'
import ConversationView from './components/ConversationView'
import LayoutWrapper from './components/LayoutWrapper'
import UserSettingsSelection from './components/UserSettingsSelection'
import ActionMessageProvider from './contexts/ActionMessageProvider'
import AuthProvider from './contexts/AuthProvider'
import CallManagerProvider from './contexts/CallManagerProvider'
import ConversationProvider from './contexts/ConversationProvider'
import MessengerProvider from './contexts/MessengerProvider'
import MobileMenuStateProvider from './contexts/MobileMenuStateProvider'
import UserMediaProvider from './contexts/UserMediaProvider'
import WebSocketProvider from './contexts/WebSocketProvider'
import { AuthenticationMethods } from './enums/authenticationMethods'
import { RouteParams } from './hooks/useUrlParams'
import AccountSettings from './pages/AccountSettings'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import AdminSetup from './pages/AdminSetup'
import GeneralSettings from './pages/GeneralSettings'
import Login from './pages/Login'
import Messenger from './pages/Messenger'
import Registration from './pages/Registration'
export type ConversationRouteParams = RouteParams<{ conversationId?: string }, Record<string, never>>

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />} loader={appLoader}>
      <Route
        element={
          <MobileMenuStateProvider>
            <Outlet />
          </MobileMenuStateProvider>
        }
      >
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Registration />} />
        <Route path="admin" element={<AdminLogin />} />
        <Route
          element={
            <AdminAuthWrapper>
              <AdminPanel>
                <Outlet />
              </AdminPanel>
            </AdminAuthWrapper>
          }
        >
          <Route path={`/admin/${AdminSettingSelection.ACCOUNTS}`} element={<AccountsOverview />} />
          <Route path={`/admin/${AdminSettingSelection.AUTHENTICATION}`} element={<AuthMethods />} />
          <Route
            path={`/admin/${AdminSettingSelection.AUTHENTICATION}/${AuthenticationMethods.JAMI}`}
            element={<LocalAuthMethod />}
          />
          <Route
            path={`/admin/${AdminSettingSelection.AUTHENTICATION}/${AuthenticationMethods.JAMS}`}
            element={<JamsAuthMethod />}
          />
          <Route
            path={`/admin/${AdminSettingSelection.ADMIN_ACCOUNT_CONFIGURATION}`}
            element={<AdminAccountConfiguration />}
          />
        </Route>
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="admin/setup" element={<AdminSetup />} />
        <Route
          element={
            <AuthProvider>
              <WebSocketProvider>
                <UserMediaProvider>
                  <CallManagerProvider>
                    <Outlet />
                  </CallManagerProvider>
                </UserMediaProvider>
              </WebSocketProvider>
            </AuthProvider>
          }
        >
          <Route
            element={
              <MessengerProvider>
                <Outlet />
              </MessengerProvider>
            }
          >
            <Route index element={<Messenger />} />
            <Route path="conversation" element={<Messenger />} />
            <Route
              path="conversation/:conversationId"
              element={
                <ActionMessageProvider>
                  <Messenger>
                    <ConversationProvider>
                      <ConversationView />
                    </ConversationProvider>
                  </Messenger>
                </ActionMessageProvider>
              }
            />
          </Route>
          <Route element={<LayoutWrapper sidebar={<UserSettingsSelection />} main={<Outlet />}></LayoutWrapper>}>
            <Route path="settings/account/manage-account" element={<AccountSettings />} />
            <Route path="settings/account/customize-profile" element={<CustomizeProfile />} />
            <Route path="settings/account/linked-devices" element={<LinkedDevices />} />
            <Route path="settings/general" element={<GeneralSettings />} />
            <Route path="contacts" element={<ContactList />} />
          </Route>
        </Route>
      </Route>
    </Route>,
  ),
)
