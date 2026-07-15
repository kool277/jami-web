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

import { AdminSettingSelection, AdminWizardState } from '@savoirfairelinux/jami-web-common'
import { lazy } from 'react'
import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route } from 'react-router-dom'

import App, { adminSetupLoader, appLoader } from './App.js'
import MobileMenuStateProvider from './contexts/MobileMenuStateProvider.js'
import { AdminConfigurationOptions } from './enums/adminConfigurationOptions.js'
import { AuthenticationMethods } from './enums/authenticationMethods.js'
import { RouteParams } from './hooks/useUrlParams.js'

const loadAdminBundle = () => import('./admin/index.js')
const AccountDetailsListener = lazy(() => import('./components/AccountDetailsListener.js'))
const AccountsOverview = lazy(() => loadAdminBundle().then(({ AccountsOverview }) => ({ default: AccountsOverview })))
const AdminAccountConfiguration = lazy(() =>
  loadAdminBundle().then(({ AdminAccountConfiguration }) => ({ default: AdminAccountConfiguration })),
)
const AdminAuthWrapper = lazy(() => loadAdminBundle().then(({ AdminAuthWrapper }) => ({ default: AdminAuthWrapper })))
const AuthMethods = lazy(() => loadAdminBundle().then(({ AuthMethods }) => ({ default: AuthMethods })))
const ConfigureOpenId = lazy(() => loadAdminBundle().then(({ ConfigureOpenId }) => ({ default: ConfigureOpenId })))
const DownloadLimit = lazy(() => loadAdminBundle().then(({ DownloadLimit }) => ({ default: DownloadLimit })))
const GuestAuthMethod = lazy(() => loadAdminBundle().then(({ GuestAuthMethod }) => ({ default: GuestAuthMethod })))
const JamsAuthMethod = lazy(() => loadAdminBundle().then(({ JamsAuthMethod }) => ({ default: JamsAuthMethod })))
const LocalAuthMethod = lazy(() => loadAdminBundle().then(({ LocalAuthMethod }) => ({ default: LocalAuthMethod })))
const MediaSettings = lazy(() => loadAdminBundle().then(({ MediaSettings }) => ({ default: MediaSettings })))
const OpenIdAuthMethod = lazy(() => loadAdminBundle().then(({ OpenIdAuthMethod }) => ({ default: OpenIdAuthMethod })))
const ContactList = lazy(() => import('./components/ContactList.js'))
const ConversationView = lazy(() => import('./components/ConversationView.js'))
const LayoutWrapper = lazy(() => import('./components/LayoutWrapper.js'))
const NotificationHandler = lazy(() => import('./components/NotificationHandler.js'))
const UserSettingsSelection = lazy(() => import('./components/UserSettingsSelection.js'))
const WelcomePage = lazy(() => import('./components/WelcomePage.js'))
const ActionMessageProvider = lazy(() => import('./contexts/ActionMessageProvider.js'))
const AuthProvider = lazy(() => import('./contexts/AuthProvider.js'))
const CallManagerProvider = lazy(() => import('./contexts/CallManagerProvider.js'))
const ConversationProvider = lazy(() => import('./contexts/ConversationProvider.js'))
const ImportDeviceProvider = lazy(() => import('./contexts/ImportDeviceProvider.js'))
const MessengerProvider = lazy(() => import('./contexts/MessengerProvider.js'))
const PresenceProvider = lazy(() => import('./contexts/PresenceProvider.js'))
const UserMediaProvider = lazy(() => import('./contexts/UserMediaProvider.js'))
const WebSocketLinkProvider = lazy(() => import('./contexts/WebSocketLinkProvider.js'))
const WebSocketProvider = lazy(() => import('./contexts/WebSocketProvider.js'))
const AccountSettings = lazy(() => import('./pages/AccountSettings.js'))
const AdminLogin = lazy(() => loadAdminBundle().then(({ AdminLogin }) => ({ default: AdminLogin })))
const AdminPanel = lazy(() => loadAdminBundle().then(({ AdminPanel }) => ({ default: AdminPanel })))
const AdminConfigureJams = lazy(() =>
  loadAdminBundle().then(({ AdminConfigureJams }) => ({ default: AdminConfigureJams })),
)
const AdminConfigureNameServer = lazy(() =>
  loadAdminBundle().then(({ AdminConfigureNameServer }) => ({ default: AdminConfigureNameServer })),
)
const AdminCreateAccount = lazy(() =>
  loadAdminBundle().then(({ AdminCreateAccount }) => ({ default: AdminCreateAccount })),
)
const CallSettings = lazy(() => import('./pages/CallSettings.js'))
const ExportToAnotherDevice = lazy(() =>
  import('./pages/ExportAccount/ExportToAnotherDevice.js').then(({ ExportToAnotherDevice }) => ({
    default: ExportToAnotherDevice,
  })),
)
const GeneralSettings = lazy(() => import('./pages/GeneralSettings.js'))
const LinkedDevicesPage = lazy(() => import('./pages/LinkedDevicesPage.js'))
const ImportAccount = lazy(() => import('./pages/LinkExistingDevice/ImportAccount.js'))
const ImportAccountConfirmation = lazy(() => import('./pages/LinkExistingDevice/ImportAccountConfirmation.js'))
const ImportAccountConnecting = lazy(() => import('./pages/LinkExistingDevice/ImportAccountConnecting.js'))
const ImportAccountLock = lazy(() => import('./pages/LinkExistingDevice/ImportAccountLock.js'))
const ImportAccountTransferInProgress = lazy(
  () => import('./pages/LinkExistingDevice/ImportAccountTransferInProgress.js'),
)
const Login = lazy(() => import('./pages/Login.js'))
const Messenger = lazy(() => import('./pages/Messenger.js'))
const Registration = lazy(() => import('./pages/Registration.js'))

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
        <Route path="admin/setup" element={<Outlet />} loader={adminSetupLoader}>
          <Route index element={<Navigate to={'/admin/setup/account'} />} />
          <Route path={AdminWizardState.account} element={<AdminCreateAccount />} />
          <Route path={AdminWizardState.local} element={<AdminConfigureNameServer />} />
          <Route path={AdminWizardState.jams} element={<AdminConfigureJams />} />
        </Route>

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
