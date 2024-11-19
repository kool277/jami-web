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

import { AdminSettingSelection, AdminWizardState } from 'jami-web-common'
import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route } from 'react-router-dom'

import App, { appLoader } from './App'
import AccountDetailsListener from './components/AccountDetailsListener'
import AccountsOverview from './components/AdminSettings/AccountsOverview'
import AdminAccountConfiguration from './components/AdminSettings/AdminAccountConfiguration'
import AdminAuthWrapper from './components/AdminSettings/AdminAuthWrapper'
import AuthMethods from './components/AdminSettings/AuthMethods'
import ConfigureOpenId from './components/AdminSettings/ConfigureOpenId'
import DownloadLimit from './components/AdminSettings/DownloadLimit'
import GuestAuthMethod from './components/AdminSettings/GuestAuthMethod'
import JamsAuthMethod from './components/AdminSettings/JamsAuthMethod'
import LocalAuthMethod from './components/AdminSettings/LocalAuthMethod'
import OpenIdAuthMethod from './components/AdminSettings/OpenIdAuthMethod'
import ContactList from './components/ContactList'
import ConversationView from './components/ConversationView'
import LayoutWrapper from './components/LayoutWrapper'
import NotificationHandler from './components/NotificationHandler'
import UserSettingsSelection from './components/UserSettingsSelection'
import ActionMessageProvider from './contexts/ActionMessageProvider'
import AuthProvider from './contexts/AuthProvider'
import CallManagerProvider from './contexts/CallManagerProvider'
import ConversationProvider from './contexts/ConversationProvider'
import ImportDeviceProvider from './contexts/ImportDeviceProvider'
import MessengerProvider from './contexts/MessengerProvider'
import MobileMenuStateProvider from './contexts/MobileMenuStateProvider'
import PresenceProvider from './contexts/PresenceProvider'
import UserMediaProvider from './contexts/UserMediaProvider'
import WebSocketLinkProvider from './contexts/WebSocketLinkProvider'
import WebSocketProvider from './contexts/WebSocketProvider'
import { AdminConfigurationOptions } from './enums/adminConfigurationOptions'
import { AuthenticationMethods } from './enums/authenticationMethods'
import { RouteParams } from './hooks/useUrlParams'
import AccountSettings from './pages/AccountSettings'
import AdminLogin from './pages/AdminLogin'
import AdminPanel from './pages/AdminPanel'
import AdminConfigureJams from './pages/AdminWizard/AdminConfigureJams'
import AdminConfigureNameServer from './pages/AdminWizard/AdminConfigureNameServer'
import AdminCreateAccount from './pages/AdminWizard/AdminCreateAccount'
import { ExportToAnotherDevice } from './pages/ExportAccount/ExportToAnotherDevice'
import GeneralSettings from './pages/GeneralSettings'
import LinkedDevicesPage from './pages/LinkedDevicesPage'
import ImportAccount from './pages/LinkExistingDevice/ImportAccount'
import ImportAccountConfirmation from './pages/LinkExistingDevice/ImportAccountConfirmation'
import ImportAccountConnecting from './pages/LinkExistingDevice/ImportAccountConnecting'
import ImportAccountLock from './pages/LinkExistingDevice/ImportAccountLock'
import ImportAccountTransferInProgress from './pages/LinkExistingDevice/ImportAccountTransferInProgress'
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
        <Route
          element={
            <WebSocketLinkProvider>
              <ImportDeviceProvider>
                <Outlet />
              </ImportDeviceProvider>
            </WebSocketLinkProvider>
          }
        >
          <Route path="import-account" element={<ImportAccount />} />
          <Route path="import-account-connecting" element={<ImportAccountConnecting />} />
          <Route path="import-account-unlock" element={<ImportAccountLock />} />
          <Route path="import-account-done" element={<ImportAccountConfirmation />} />
          <Route path="import-account-in-progress" element={<ImportAccountTransferInProgress />} />
        </Route>
        <Route path="register" element={<Registration />} />
        <Route path="admin" element={<Navigate to={'/admin/login'} />} />
        <Route path="admin/login" element={<AdminLogin />} />
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
            path={`/admin/${AdminSettingSelection.AUTHENTICATION}/${AuthenticationMethods.GUEST}`}
            element={<GuestAuthMethod />}
          />
          <Route
            path={`/admin/${AdminSettingSelection.AUTHENTICATION}/${AuthenticationMethods.OPENID}`}
            element={<OpenIdAuthMethod />}
          />
          <Route
            path={`/admin/${AdminSettingSelection.AUTHENTICATION}/${AuthenticationMethods.OPENID}/:provider`}
            element={<ConfigureOpenId />}
          />
          <Route
            path={`admin/${AdminSettingSelection.CONFIGURATION}/${AdminConfigurationOptions.ACCOUNT}`}
            element={<AdminAccountConfiguration />}
          />
          <Route
            path={`admin/${AdminSettingSelection.CONFIGURATION}/${AdminConfigurationOptions.AUTO_DOWNLOAD_LIMIT}`}
            element={<DownloadLimit />}
          />
        </Route>
        <Route path="admin/setup" element={<Navigate to={'/admin/setup/account'} />} />
        <Route path={`admin/setup/${AdminWizardState.account}`} element={<AdminCreateAccount />} />
        <Route path={`admin/setup/${AdminWizardState.local}`} element={<AdminConfigureNameServer />} />
        <Route path={`admin/setup/${AdminWizardState.jams}`} element={<AdminConfigureJams />} />

        <Route
          element={
            <AuthProvider>
              <WebSocketProvider>
                <PresenceProvider>
                  <AccountDetailsListener>
                    <UserMediaProvider>
                      <CallManagerProvider>
                        <Outlet />
                      </CallManagerProvider>
                    </UserMediaProvider>
                  </AccountDetailsListener>
                </PresenceProvider>
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
                      <NotificationHandler>
                        <ConversationView />
                      </NotificationHandler>
                    </ConversationProvider>
                  </Messenger>
                </ActionMessageProvider>
              }
            />
          </Route>
          <Route
            element={
              <NotificationHandler>
                <LayoutWrapper sidebar={<UserSettingsSelection />} main={<Outlet />}></LayoutWrapper>
              </NotificationHandler>
            }
          >
            <Route path="settings/account/manage-account" element={<AccountSettings />} />
            <Route path="settings/account/linked-devices" element={<LinkedDevicesPage />} />
            <Route path="settings/account/linked-devices/export" element={<ExportToAnotherDevice />} />
            <Route path="settings/general" element={<GeneralSettings />} />
            <Route path="contacts" element={<ContactList />} />
          </Route>
        </Route>
      </Route>
    </Route>,
  ),
)
