# Jami Web - Exploration & Bug Fix Notes

## Setup

- **Mock server**: `npx tsx tests/mock-server.ts` (port 5002)
- **Client dev server**: `npm run start --workspace=client` (port 3000)
- **Run all Playwright tests**: `npx playwright test --project=chromium`

## Test Credentials

| Role  | Username | Password  |
| ----- | -------- | --------- |
| Admin | admin    | admin123  |
| User  | testuser | Test1234! |

## Bugs Found & Fixed

### 1. `[object Object]` in Name Server field (FIXED)

**File**: `tests/mock-server.ts`
**Route**: `/admin/setup/ns` (Admin Wizard - Name Server step)

**Root cause**: The mock server's `/api/admin/nameserver` endpoint returned a JSON object `{ nameserver: '' }` instead of a plain string. The real server uses `res.send(nameserver)` (plain text), but the mock used `res.json({ nameserver: '' })`. The client hook `useGetNameServer()` passes `data` directly to `useState<string>`, so the object was coerced to `"[object Object]"`.

**Fix**: Changed `res.json({ nameserver: '' })` to `res.send('')` in the mock server.

### 2. Infinite spinner on JAMS configuration page (FIXED)

**File**: `tests/mock-server.ts`
**Route**: `/admin/setup/jams` (Admin Wizard - JAMS step)

**Root cause**: The mock server had no handler for `/api/admin/jamsurl` (GET/POST/DELETE). The `AdminConfigureJams` component calls `useGetJamsUrl()` on mount. When the API returned 501 (unhandled route), the query errored, `data` stayed `undefined`, and the component's guard `if (data === undefined || jamsCurrentUrl === undefined)` kept showing `<ProcessingRequest open />` (loading spinner) indefinitely.

**Fix**: Added GET/POST/DELETE handlers for `/admin/jamsurl` to the mock server:

- GET returns 204 when not set, or the URL as plain text when set
- POST sets the JAMS URL and enables JAMS auth
- DELETE removes the JAMS URL and disables JAMS auth

### 3. Spurious `/conversations//preferences` API error (FIXED)

**File**: `client/src/services/conversationQueries.ts`
**Console error**: `Failed to load resource: http://localhost:5002/api/conversations//preferences`

**Root cause**: `useConversationPreferencesQuery()` was missing the `enabled: !!conversationId` guard. It's called from `NotificationHandler.tsx` with an initially empty string `conversationId` (`useState<string>('')`), causing an immediate API call with an empty ID → double slash in the URL.

**Fix**: Added `enabled: !!conversationId` to the `useQuery` options in `useConversationPreferencesQuery`.

### 4. Missing i18n translation keys (IMPROVED)

**File**: `tests/mock-server.ts`

Many UI elements showed raw i18n keys (e.g., `admin_page_create_button`, `configure_nameserver`, `message_input_placeholder_2`) because the mock server's `/config/languages/:language` endpoint only provided a few translation keys. Added ~30 commonly needed translation keys to the mock response.

### 5. Test regex too strict for translated text (FIXED)

**File**: `tests/user-flows.spec.ts`

After adding proper translations, the test `login page shows import account button` failed because it used a regex `/connect_from_another_device/i` (with underscores) which didn't match the translated text "Connect from another device" (with spaces). Changed the regex to `/connect.from.another.device/i` to match both raw keys and translated strings.

## Current State

- All 31 focused Playwright tests pass (admin-setup, user-flows, messaging)
- Admin wizard flows through all steps: Account → Name Server → JAMS → Dashboard
- User registration and login work correctly
- Messaging (send/receive) works correctly
- Remaining untranslated keys are cosmetic and would be resolved by a complete translation file
