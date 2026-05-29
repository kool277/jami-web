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

import App, { appLoader } from './App.js'
import AccountDetailsListener from './components/AccountDetailsListener.js'
import AccountsOverview from './components/AdminSettings/AccountsOverview.js'
import AdminAccountConfiguration from './components/AdminSettings/AdminAccountConfiguration.js'
import AdminAuthWrapper from './components/AdminSettings/AdminAuthWrapper.js'
import AuthMethods from './components/AdminSettings/AuthMethods.js'
import ConfigureOpenId from './components/AdminSettings/ConfigureOpenId.js'
import DownloadLimit from './components/AdminSettings/DownloadLimit.js'
import GuestAuthMethod from './components/AdminSettings/GuestAuthMethod.js'
import JamsAuthMethod from './components/AdminSettings/JamsAuthMethod.js'
import LocalAuthMethod from './components/AdminSettings/LocalAuthMethod.js'
import MediaSettings from './components/AdminSettings/MediaSettings.js'
import OpenIdAuthMethod from './components/AdminSettings/OpenIdAuthMethod.js'
import ContactList from './components/ContactList.js'
import ConversationView from './components/ConversationView.js'
import LayoutWrapper from './components/LayoutWrapper.js'
import NotificationHandler from './components/NotificationHandler.js'
import UserSettingsSelection from './components/UserSettingsSelection.js'
import WelcomePage from './components/WelcomePage.js'
import ActionMessageProvider from './contexts/ActionMessageProvider.js'
import AuthProvider from './contexts/AuthProvider.js'
import CallManagerProvider from './contexts/CallManagerProvider.js'
import ConversationProvider from './contexts/ConversationProvider.js'
import ImportDeviceProvider from './contexts/ImportDeviceProvider.js'
import MessengerProvider from './contexts/MessengerProvider.js'
import MobileMenuStateProvider from './contexts/MobileMenuStateProvider.js'
import PresenceProvider from './contexts/PresenceProvider.js'
import UserMediaProvider from './contexts/UserMediaProvider.js'
import WebSocketLinkProvider from './contexts/WebSocketLinkProvider.js'
import WebSocketProvider from './contexts/WebSocketProvider.js'
import { AdminConfigurationOptions } from './enums/adminConfigurationOptions.js'
import { AuthenticationMethods } from './enums/authenticationMethods.js'
import { RouteParams } from './hooks/useUrlParams.js'
import AccountSettings from './pages/AccountSettings.js'
import AdminLogin from './pages/AdminLogin.js'
import AdminPanel from './pages/AdminPanel.js'
import AdminConfigureJams from './pages/AdminWizard/AdminConfigureJams.js'
import AdminConfigureNameServer from './pages/AdminWizard/AdminConfigureNameServer.js'
import AdminCreateAccount from './pages/AdminWizard/AdminCreateAccount.js'
import CallSettings from './pages/CallSettings.js'
import { ExportToAnotherDevice } from './pages/ExportAccount/ExportToAnotherDevice.js'
import GeneralSettings from './pages/GeneralSettings.js'
import LinkedDevicesPage from './pages/LinkedDevicesPage.js'
import ImportAccount from './pages/LinkExistingDevice/ImportAccount.js'
import ImportAccountConfirmation from './pages/LinkExistingDevice/ImportAccountConfirmation.js'
import ImportAccountConnecting from './pages/LinkExistingDevice/ImportAccountConnecting.js'
import ImportAccountLock from './pages/LinkExistingDevice/ImportAccountLock.js'
import ImportAccountTransferInProgress from './pages/LinkExistingDevice/ImportAccountTransferInProgress.js'
import Login from './pages/Login.js'
import Messenger from './pages/Messenger.js'
import Registration from './pages/Registration.js'

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
          <Route
            path={`admin/${AdminSettingSelection.CONFIGURATION}/${AdminConfigurationOptions.MEDIA}`}
            element={<MediaSettings />}
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
            <Route element={<Messenger />}>
              <Route index element={<WelcomePage />} />
              <Route path="conversation" element={<WelcomePage />} />
              <Route
                path="conversation/:conversationId"
                element={
                  <ActionMessageProvider>
                    <ConversationProvider>
                      <NotificationHandler>
                        <ConversationView />
                      </NotificationHandler>
                    </ConversationProvider>
                  </ActionMessageProvider>
                }
              />
            </Route>
          </Route>
          <Route
            element={
              <NotificationHandler>
                <LayoutWrapper sidebar={<UserSettingsSelection />} main={<Outlet />}></LayoutWrapper>
              </NotificationHandler>
            }
          >
            <Route path="settings/account/manage-account" element={<AccountSettings />} />
            <Route path="settings/account/calls" element={<CallSettings />} />
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
