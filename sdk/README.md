# @jami/sdk

TypeScript SDK for interacting with a [Jami](https://jami.net) account through the jami-web server REST API and WebSocket API.

## Installation

```bash
npm install @jami/sdk
```

## Quick Start

### Authentication with credentials

```typescript
import { JamiClient } from '@jami/sdk'

const client = new JamiClient({
  server: 'http://localhost:5002',
  credentials: {
    username: 'alice',
    password: 'secret',
  },
})

// List conversations
const conversations = await client.conversations.list()
console.log(conversations)

// Send a message
await client.conversations.sendMessage(conversations[0].id, 'Hello!')
```

### Authentication with an API token

```typescript
import { JamiClient } from '@jami/sdk'

const client = new JamiClient({
  server: 'https://jami.example.com',
  token: 'jm_sk_...',
})

const account = await client.account.get()
console.log(account.details['Account.displayName'])
```

### Creating API tokens

```typescript
const { token, info } = await client.tokens.create({
  name: 'my-bot',
  scopes: ['conversations:read', 'conversations:write'],
  expiresIn: '30d',
})
console.log('Token:', token) // Save this — it cannot be retrieved later
```

## API Reference

### `JamiClient`

Main entry point. Initializes all API sub-clients.

| Property               | Type                     | Description                                                          |
| ---------------------- | ------------------------ | -------------------------------------------------------------------- |
| `account`              | `AccountApi`             | Account details, display name, device management, default moderators |
| `conversations`        | `ConversationApi`        | Conversations, messages, members, preferences                        |
| `conversationRequests` | `ConversationRequestApi` | Incoming conversation requests                                       |
| `contacts`             | `ContactApi`             | Contact management                                                   |
| `calls`                | `CallApi`                | Active calls                                                         |
| `dataTransfer`         | `DataTransferApi`        | File transfer info and downloads                                     |
| `tokens`               | `TokenApi`               | API token management                                                 |
| `events`               | `EventClient`            | Real-time WebSocket events                                           |

### `EventClient` — Real-time events

```typescript
await client.events.connect()

// Listen for new messages
const unsubscribe = client.events.on('conversation-message', (msg) => {
  console.log(`New message in ${msg.conversationId}: ${msg.body}`)
})

// Send WebSocket messages
client.events.send('conversation-view', { conversationId: '...' })

// Clean up
unsubscribe()
client.events.disconnect()
```

### `ConversationRequestApi`

```typescript
// List pending requests
const requests = await client.conversationRequests.list()

// Accept a request
const conversation = await client.conversationRequests.accept(requests[0].conversationId)

// Decline or block
await client.conversationRequests.decline(conversationId)
await client.conversationRequests.block(conversationId)
```

### Error Handling

All API methods throw `HttpError` on failure:

```typescript
import { HttpError } from '@jami/sdk'

try {
  await client.contacts.get('nonexistent')
} catch (err) {
  if (err instanceof HttpError) {
    console.error(`HTTP ${err.status}: ${err.message}`)
  }
}
```

## Development

### Prerequisites

- Node.js >= 18
- npm >= 9

### Building

Within the jami-web monorepo:

```bash
# From the repository root — builds all workspaces including common
npm install
npm run build --workspace common
npm run build --workspace sdk
```

### Testing

```bash
npm test --workspace sdk            # single run
npm run test:watch --workspace sdk  # watch mode
npm run test:coverage --workspace sdk  # with coverage
```

108 unit tests cover all API classes, HTTP client, authentication, JamiClient initialization, and the real-time EventClient.

The SDK does not embed the Jami daemon. It always communicates with a running jami-web server.

## Standalone Packaging

The SDK can be published independently from the jami-web client application.

### Dependency on `jami-web-common`

The SDK depends on `jami-web-common` for shared TypeScript interfaces and enums (`AccountDetails`, `ContactDetails`, `Message`, `WebSocketMessageType`, etc.). These types are re-exported from `@jami/sdk` for consumer convenience.

For npm publishing, `jami-web-common` must also be published (or the shared types bundled into the SDK). Two strategies:

1. **Publish `jami-web-common` as a package** (e.g. `@jami/common`) so it can be resolved by consumers via npm.
2. **Bundle the common types** into the SDK output using a bundler (e.g. `tsup`, `rollup`) to produce a self-contained package with no workspace dependencies.

### Publishing to npm

1. **Authenticate** with the npm registry:

   ```bash
   npm login
   # Or for a private registry:
   npm login --registry=https://your-registry.example.com
   ```

2. **Verify the package contents** before publishing:

   ```bash
   cd sdk
   npm pack --dry-run
   ```

This shows exactly which files will be included. Only `dist/`, `README.md`, and `LICENSE` are shipped (controlled by the `files` field in `package.json`).

3. **Run pre-publish checks** (automated by `prepublishOnly`):

   ```bash
   npm run clean && npm run build && npm test
   ```

4. **Publish**:

   ```bash
   # First release
   npm publish --access public

   # Subsequent releases
   npm version patch  # or minor / major
   npm publish
   ```

5. **Scoped registry** (if using a private registry like GitLab):
   ```bash
   npm config set @jami:registry https://git.jami.net/api/v4/projects/<id>/packages/npm/
   npm publish
   ```

### CI/CD Publishing

Add to your CI pipeline (GitLab CI / Jenkins):

```yaml
publish-sdk:
  stage: publish
  script:
    - cd sdk
    - echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
    - npm publish --access public
  only:
    - tags
```

### Versioning

The package follows [semver](https://semver.org/). Use `npm version` to bump:

```bash
npm version patch   # 0.1.0 → 0.1.1  (bug fixes)
npm version minor   # 0.1.1 → 0.2.0  (new features, backward-compatible)
npm version major   # 0.2.0 → 1.0.0  (breaking changes)
```

## License

AGPL-3.0-or-later — see [COPYING](../COPYING) for details.
