/*
 * Copyright (C) 2025 Savoir-faire Linux Inc.
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
import { createServer, type Server } from 'node:http'

import cors from 'cors'
import express from 'express'
import { WebSocket, WebSocketServer as WsServer } from 'ws'

interface MockServerState {
  isSetupComplete: boolean
  lastWizardState: string | undefined
  adminPassword: string | undefined
  config: {
    localAuthEnabled: boolean
    jamsAuthEnabled: boolean
    guestAccessEnabled: boolean
    openIdAuthEnabled: boolean
    uploadPath: string
    jamsUrl?: string
  }
  users: Record<string, { password: string; accountId: string }>
  adminPasskeys: { credentialId: string; name: string; createdAt: string }[]
  userPasskeys: Record<string, { credentialId: string; name: string; createdAt: string }[]>
  autoDownloadLimit: number
}

const defaultState: MockServerState = {
  isSetupComplete: false,
  lastWizardState: undefined,
  adminPassword: undefined,
  config: {
    localAuthEnabled: true,
    jamsAuthEnabled: false,
    guestAccessEnabled: false,
    openIdAuthEnabled: false,
    uploadPath: '/tmp/jami-uploads',
  },
  users: {},
  adminPasskeys: [],
  userPasskeys: {},
  autoDownloadLimit: 0,
}

/**
 * Default state used when starting the mock server in standalone (development) mode.
 * Admin is pre-configured so the app goes straight to the login page.
 * Default credentials:
 *   Admin password : AdminPass123!
 *   User           : testuser / Test1234!
 */
const standaloneInitialState: Partial<MockServerState> = {
  isSetupComplete: true,
  lastWizardState: 'complete',
  adminPassword: 'AdminPass123!',
  users: {
    testuser: { password: 'Test1234!', accountId: 'acc-testuser' },
  },
}

const mockOAuthProviders = [
  { name: 'google', isActive: false, displayName: 'Google' },
  { name: 'github', isActive: false, displayName: 'GitHub' },
]

export function createMockServer(initialState: Partial<MockServerState> = {}): {
  app: express.Express
  server: Server
  state: MockServerState
  wsClients: Set<WebSocket>
} {
  const state: MockServerState = { ...defaultState, ...initialState }
  const wsClients = new Set<WebSocket>()
  const app = express()

  app.use(cors())
  app.use(express.json())

  const api = express.Router()
  app.use('/api', api)

  // --- Admin routes ---

  api.get('/admin/check', (_req, res) => {
    res.json({ isSetupComplete: state.isSetupComplete, electronMode: false })
  })

  api.get('/admin/adminWizardState', (_req, res) => {
    res.json({ lastWizardState: state.lastWizardState })
  })

  api.post('/admin/create', (req, res) => {
    const { password } = req.body
    if (state.isSetupComplete) {
      res.status(403).send('Admin account already exists')
      return
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).send('Password must be at least 8 characters long')
      return
    }
    state.adminPassword = password
    state.isSetupComplete = true
    state.lastWizardState = 'ns' // After account creation, next step is name server
    res.json({ accessToken: 'mock-admin-token-' + Date.now() })
  })

  api.post('/admin/login', (req, res) => {
    const { password } = req.body
    if (!password) {
      res.status(400).send('Missing password in body')
      return
    }
    if (!state.adminPassword) {
      res.status(500).send('Admin password not found')
      return
    }
    if (password !== state.adminPassword) {
      res.status(401).send('Incorrect password')
      return
    }
    res.json({ accessToken: 'mock-admin-token-' + Date.now() })
  })

  api.get('/admin/config', (_req, res) => {
    res.json(state.config)
  })

  api.patch('/admin/config', (req, res) => {
    Object.assign(state.config, req.body)
    res.sendStatus(200)
  })

  api.post('/admin/adminWizardState', (req, res) => {
    state.lastWizardState = req.body.state
    res.sendStatus(200)
  })

  api.get('/admin/isTokenValid', (_req, res) => {
    // Accept any token for mock purposes
    res.sendStatus(200)
  })

  // Admin passkey availability
  api.get('/admin/passkey/available', (_req, res) => {
    res.json({ available: state.adminPasskeys.length > 0 })
  })

  // Admin passkey login/options — returns mock options (WebAuthn ceremony can't run in mock)
  api.post('/admin/passkey/login/options', (_req, res) => {
    if (state.adminPasskeys.length === 0) {
      res.status(404).send('No passkeys registered for admin')
      return
    }
    res.json({
      challenge: 'mock-admin-challenge',
      challengeKey: 'mock-admin-challenge-key',
      rpId: 'localhost',
      allowCredentials: state.adminPasskeys.map((pk) => ({ id: pk.credentialId })),
    })
  })

  // Admin passkey login/verify — always fails in mock (no real WebAuthn)
  api.post('/admin/passkey/login/verify', (_req, res) => {
    res.status(401).send('WebAuthn not available in mock')
  })

  // Admin passkey credentials (authenticated)
  api.get('/admin/passkey/credentials', (_req, res) => {
    res.json(state.adminPasskeys)
  })

  // Admin passkey register/options
  api.post('/admin/passkey/register/options', (_req, res) => {
    res.json({ challenge: 'mock-reg-challenge', rpId: 'localhost', rp: { name: 'Jami Web' } })
  })

  // Admin passkey register/verify — always fails in mock
  api.post('/admin/passkey/register/verify', (_req, res) => {
    res.status(400).send('WebAuthn not available in mock')
  })

  // Admin passkey delete
  api.delete('/admin/passkey/credentials/:credentialId', (req, res) => {
    const idx = state.adminPasskeys.findIndex((pk) => pk.credentialId === req.params.credentialId)
    if (idx === -1) {
      res.status(404).send('Credential not found')
      return
    }
    state.adminPasskeys.splice(idx, 1)
    res.sendStatus(204)
  })

  // --- User passkey endpoints ---

  // User passkey login/options
  api.post('/passkey/login/options', (_req, res) => {
    res.json({
      challenge: 'mock-user-challenge',
      challengeKey: 'mock-user-challenge-key',
      rpId: 'localhost',
      allowCredentials: [],
    })
  })

  // User passkey login/verify — always fails in mock
  api.post('/passkey/login/verify', (_req, res) => {
    res.status(401).send('WebAuthn not available in mock')
  })

  // User passkey credentials (authenticated)
  api.get('/passkey/credentials', (_req, res) => {
    const userPasskeys = state.userPasskeys['testuser'] ?? []
    res.json(userPasskeys)
  })

  // User passkey register/options
  api.post('/passkey/register/options', (_req, res) => {
    res.json({ challenge: 'mock-reg-challenge', rpId: 'localhost', rp: { name: 'Jami Web' } })
  })

  // User passkey register/verify — always fails in mock
  api.post('/passkey/register/verify', (_req, res) => {
    res.status(400).send('WebAuthn not available in mock')
  })

  // User passkey delete
  api.delete('/passkey/credentials/:credentialId', (_req, res) => {
    res.sendStatus(204)
  })

  api.get('/admin/nameserver', (_req, res) => {
    res.send('')
  })

  api.get('/admin/accounts', (_req, res) => {
    res.json([])
  })

  api.get('/admin/oauth/providers', (_req, res) => {
    res.json(mockOAuthProviders)
  })

  api.get('/admin/oauth/provider/:name', (req, res) => {
    const provider = mockOAuthProviders.find((item) => item.name === req.params.name)
    if (!provider) {
      res.status(404).send('Provider not found')
      return
    }

    res.json({
      clientId: '',
      isActive: provider.isActive,
      redirectUri: `http://localhost:5002/api/auth/oauth/${provider.name}/callback`,
      documentation: 'https://example.com/oauth-docs',
      displayName: provider.displayName,
      icon: '',
    })
  })

  api.patch('/admin/oauth/provider/:name', (req, res) => {
    const provider = mockOAuthProviders.find((item) => item.name === req.params.name)
    if (!provider) {
      res.status(404).send('Provider not found')
      return
    }

    if (req.body.isActive !== undefined) {
      provider.isActive = req.body.isActive
    }
    res.sendStatus(200)
  })

  // --- JAMS URL routes ---

  api.get('/admin/jamsurl', (_req, res) => {
    if (!state.config.jamsUrl) {
      res.status(204).send('JAMS server URL is not set')
      return
    }
    res.send(state.config.jamsUrl)
  })

  api.get('/data/autoDownloadLimit', (_req, res) => {
    res.json({ limit: state.autoDownloadLimit })
  })

  api.post('/admin/autoDownloadLimit', (req, res) => {
    const limit = req.body.limit
    if (limit === undefined || limit < 0) {
      res.status(400).send('Invalid limit')
      return
    }
    state.autoDownloadLimit = limit
    res.sendStatus(200)
  })

  api.post('/admin/jamsurl', (req, res) => {
    const jamsUrl = req.body.url
    if (!jamsUrl || jamsUrl === '') {
      res.status(400).send('URL not provided')
      return
    }
    state.config.jamsUrl = jamsUrl
    state.config.jamsAuthEnabled = true
    res.sendStatus(200)
  })

  api.delete('/admin/jamsurl', (_req, res) => {
    delete state.config.jamsUrl
    state.config.jamsAuthEnabled = false
    res.sendStatus(200)
  })

  // --- Auth routes ---

  api.post('/auth/new-account', (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).send('Missing username or password in body')
      return
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).send('Password must be at least 8 characters long')
      return
    }
    if (state.users[username]) {
      res.status(409).send('Username already exists locally')
      return
    }
    state.users[username] = { password, accountId: 'acc-' + Date.now() }
    res.sendStatus(201)
  })

  api.post('/auth/login', (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).send('Missing username or password')
      return
    }
    const user = state.users[username]
    if (!user || user.password !== password) {
      res.status(401).send('Invalid credentials')
      return
    }
    res.json({ accessToken: 'mock-user-token-' + Date.now() })
  })

  api.get('/auth/oauth/providers', (_req, res) => {
    res.json([])
  })

  // --- Namespace routes ---

  api.head('/ns/name/:username', (req, res) => {
    const { username } = req.params
    if (state.users[username]) {
      res.sendStatus(200)
    } else {
      res.sendStatus(404)
    }
  })

  // --- Config routes ---

  api.get('/config', (_req, res) => {
    res.json({})
  })

  api.get('/config/languages', (_req, res) => {
    res.json([{ tag: 'en', fullName: 'English' }])
  })

  api.get('/config/languages/:language', (_req, res) => {
    // Return minimal translation keys (snake_case matches i18n convention)
    /* eslint-disable camelcase */
    res.json({
      app_name: 'Jami',
      login_form_submit_button: 'Log in',
      admin_page_login_title: 'Administration',
      admin_page_login_subtitle: 'Enter the admin password',
      password_placeholder: 'Password',
      password_input_helper_text_empty: 'Password is required',
      username_input_helper_text_empty: 'Username is required',
      registration_form_submit_button: 'Register',
      register_link: 'Register',
      welcome_text: 'Welcome to Jami',
      admin_page_setup_title: 'Setup',
      admin_page_setup_subtitle: 'Create an admin password',
      admin_page_password_placeholder: 'Enter password',
      admin_page_password_repeat_placeholder: 'Repeat password',
      admin_page_create_button: 'Create admin account',
      configure_nameserver: 'Configure the name server for your users.',
      setting_name_server: 'Name Server',
      setting_can_be_changed_later: 'This setting can be changed later.',
      next: 'Next',
      no_oauth_providers: 'No OAuth providers are available.',
      previous: 'Previous',
      configure_jams_server: 'Configure the JAMS server for enterprise authentication.',
      enter_jams_server: 'Enter JAMS server URL',
      admin_page_welcome: 'Welcome to Jami Administration',
      go_to_login_page: 'Go to login page',
      admin_account_configuration: 'Account Configuration',
      accounts: 'Accounts',
      authentication: 'Authentication',
      jami: 'Jami',
      jams: 'JAMS',
      openid: 'OpenID',
      jami_authentication: 'Jami Local Authentication',
      jami_authentication_info: 'Local authentication allows users to register an account by providing a username.',
      jams_authentication: 'JAMS authentication',
      jams_authentication_info: 'JAMS authentication allows users to connect with a JAMS server.',
      openid_authentication: 'OpenID authentication',
      setting_auth_change: '{{authMethod}} authentication',
      setting_enabled: 'Enabled',
      setting_disabled: 'Disabled',
      save_button: 'Save',
      reset_nameserver_button: 'Reset',
      jams_url: 'JAMS URL',
      logout: 'Logout',
      admin_page_accounts_overview_title: 'Accounts Overview',
      username_input_label: 'Username',
      password_input_label: 'Password',
      connect_from_another_device: 'Connect from another device',
      login_form_to_registration_text: "Don't have an account? ",
      login_form_to_registration_link: 'Register',
      registration_form_to_login_text: 'Already have an account? ',
      registration_form_to_login_link: 'Log in',
      conversations: 'Conversations',
      find_users_and_conversations: 'Find users and conversations',
      welcome_page_text: 'Welcome to Jami Web',
      about_jami: 'About Jami',
      message_input_placeholder_2: 'Write a message...',
      select_placeholder: 'Select...',
      severity: 'Severity',
      extending_session_success_alert: 'Session extended successfully',
      extending_session_error_alert: 'Failed to extend session',
      unknown_error_alert: 'An unknown error occurred',
      username_input_helper_text: 'Username available',
      today: 'Today',
    })
    /* eslint-enable camelcase */
  })

  // --- Test helper: reset state ---
  // Always resets to a clean defaultState regardless of the initialState used at startup.
  // This ensures tests that need a blank slate (e.g. admin-setup tests) work correctly.
  app.post('/__reset', (_req, res) => {
    Object.assign(state, { ...defaultState })
    state.config = { ...defaultState.config }
    state.users = {}
    state.adminPasskeys = []
    state.userPasskeys = {}
    res.sendStatus(200)
  })

  // --- Account routes (authenticated) ---

  api.get('/account', (_req, res) => {
    res.json({
      id: 'mock-account-id',
      details: {
        'Account.id': 'mock-account-id',
        'Account.type': 'RING',
        'Account.alias': 'Test User',
        'Account.displayName': 'Test User',
        'Account.username': 'testuser',
        'Account.deviceID': 'mock-device-id',
        'Account.deviceName': 'Mock Device',
        'Account.enable': 'true',
        'Account.videoEnabled': 'true',
        'Account.autoAnswer': 'false',
        'Account.rendezVous': 'false',
        'RingNS.uri': '',
      },
      volatileDetails: {
        'Account.registeredName': 'testuser',
        'Account.registrationStatus': 'REGISTERED',
      },
      defaultModerators: [],
      devices: { 'mock-device-id': 'Mock Device' },
    })
  })

  api.get('/account/profile/picture', (_req, res) => {
    res.json('')
  })

  api.put('/account/profile', (_req, res) => {
    res.sendStatus(200)
  })

  // --- Contacts routes ---

  api.get('/contacts', (_req, res) => {
    res.json([
      {
        uri: 'contact-bob-uri',
        registeredName: 'bob',
        added: String(Math.floor(Date.now() / 1000) - 3600),
        confirmed: 'true',
      },
    ])
  })

  api.get('/contacts/:contactId', (req, res) => {
    res.json({
      uri: req.params.contactId,
      registeredName: 'bob',
      added: String(Math.floor(Date.now() / 1000) - 3600),
      confirmed: 'true',
    })
  })

  api.get('/contacts/:contactId/profile/picture', (_req, res) => {
    res.json('')
  })

  api.get('/contacts/:contactId/username', (req, res) => {
    res.json('bob')
  })

  // --- Conversations routes ---

  api.get('/conversations', (_req, res) => {
    res.json([
      {
        id: 'conv-1',
        avatar: '',
        title: '',
        mode: '0',
        membersNames: ['Bob'],
        lastMessage: {
          id: 'msg-1',
          author: 'contact-bob-uri',
          body: 'Hello Alice!',
          type: 'text/plain',
          timestamp: String(Math.floor(Date.now() / 1000) - 60),
          linearizedParent: '',
          parents: '',
          status: {},
          reactions: [],
        },
      },
    ])
  })

  api.get('/conversations/:conversationId/infos', (req, res) => {
    res.json({
      id: req.params.conversationId,
      title: 'Chat with Bob',
      avatar: '',
      description: '',
      mode: '0',
    })
  })

  api.get('/conversations/:conversationId/members', (_req, res) => {
    res.json([
      { role: 'admin', contact: { uri: 'testuser', registeredName: 'testuser' } },
      { role: 'member', contact: { uri: 'contact-bob-uri', registeredName: 'bob' } },
    ])
  })

  api.get('/conversations/:conversationId/messages', (_req, res) => {
    res.json([
      {
        id: 'msg-1',
        author: 'contact-bob-uri',
        body: 'Hello Alice!',
        type: 'text/plain',
        timestamp: String(Math.floor(Date.now() / 1000) - 60),
        linearizedParent: '',
        parents: '',
        status: {},
        reactions: [],
      },
    ])
  })

  api.post('/conversations/:conversationId/messages', (req, res) => {
    const msgId = 'msg-' + Date.now()
    const conversationId = req.params.conversationId
    const body = req.body.body || ''

    // Broadcast via WebSocket as a ConversationMessage event
    const wsMessage = JSON.stringify({
      type: 'conversation-message',
      data: {
        conversationId,
        message: {
          id: msgId,
          author: 'testuser',
          body,
          type: 'text/plain',
          timestamp: String(Math.floor(Date.now() / 1000)),
          linearizedParent: '',
          parents: '',
          status: {},
          reactions: [],
        },
      },
    })
    for (const client of wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(wsMessage)
      }
    }

    res.json({ id: msgId })
  })

  api.get('/conversations/:conversationId/preferences', (_req, res) => {
    res.json({})
  })

  // --- Message edit endpoint ---
  api.post('/conversations/:conversationId/editmessage', (req, res) => {
    const { body, messageId } = req.body
    const conversationId = req.params.conversationId

    // Broadcast a message-edition event via WebSocket
    const wsMessage = JSON.stringify({
      type: 'message-edition',
      data: {
        conversationId,
        message: {
          id: messageId,
          author: 'testuser',
          body,
          type: 'text/plain',
          timestamp: String(Math.floor(Date.now() / 1000)),
          linearizedParent: '',
          parents: '',
          status: {},
          reactions: [],
        },
      },
    })
    for (const client of wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(wsMessage)
      }
    }

    res.sendStatus(200)
  })

  // --- Message delete endpoint ---
  api.delete('/conversations/delete/:conversationId/:messageId', (req, res) => {
    res.sendStatus(200)
  })

  api.get('/conversations/:conversationId/files', (_req, res) => {
    res.json([])
  })

  api.get('/conversation-requests', (_req, res) => {
    res.json([])
  })

  // --- File upload endpoint ---
  api.post('/data/:conversationId', (_req, res) => {
    res.json({ id: 'file-msg-' + Date.now() })
  })

  // --- Test helper: inject WebSocket message to all connected clients ---
  app.post('/__ws-send', (req, res) => {
    const message = JSON.stringify(req.body)
    for (const client of wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    }
    res.json({ sent: wsClients.size })
  })

  // --- Test helper: add a mock admin passkey ---
  app.post('/__add-admin-passkey', (req, res) => {
    const { credentialId, name } = req.body
    state.adminPasskeys.push({
      credentialId: credentialId || 'mock-cred-' + Date.now(),
      name: name || 'Test Passkey',
      createdAt: new Date().toISOString(),
    })
    res.sendStatus(200)
  })

  // --- Catch-all for unimplemented routes ---
  api.all('*', (req, res) => {
    console.log(`[mock-server] Unhandled: ${req.method} ${req.url}`)
    res.status(501).json({ error: 'Not implemented in mock server', path: req.url })
  })

  const server = createServer(app)

  // --- WebSocket server ---
  const wss = new WsServer({ noServer: true })
  server.on('upgrade', (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  })
  wss.on('connection', (ws) => {
    wsClients.add(ws)
    ws.on('close', () => wsClients.delete(ws))
    ws.on('message', (data) => {
      try {
        JSON.parse(data.toString())
        // Don't echo, just acknowledge — real server sends events proactively
      } catch {
        // ignore
      }
    })
  })

  return { app, server, state, wsClients }
}

export function startMockServer(
  port: number = 5002,
  initialState: Partial<MockServerState> = {},
): Promise<{ server: Server; state: MockServerState; wsClients: Set<WebSocket>; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const { server, state, wsClients } = createMockServer(initialState)
    server.listen(port, () => {
      console.log(`[mock-server] Listening on port ${port}`)
      resolve({
        server,
        state,
        wsClients,
        close: () => new Promise<void>((r) => server.close(() => r())),
      })
    })
  })
}

// Allow running standalone: npx tsx tests/mock-server.ts
if (process.argv[1]?.endsWith('mock-server.ts') || process.argv[1]?.endsWith('mock-server.js')) {
  startMockServer(5002, standaloneInitialState).then(() => {
    console.log('[mock-server] Ready')
    console.log('[mock-server] Admin pre-configured — skip setup wizard')
    console.log('[mock-server]   Admin password : AdminPass123!')
    console.log('[mock-server]   User login     : testuser / Test1234!')
  })
}
