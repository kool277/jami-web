# Jami Web - Exploration & Bug Fix Notes

## Setup

- **Mock server**: `npx tsx tests/mock-server.ts` (port 5002)
- **Client dev server**: `npm run start --workspace=client` (port 3000)
- **Run all Playwright tests**: `npx playwright test --project=chromium`

## Default credentials (standalone mock server)

The mock server starts with admin and a test user already configured — no setup wizard required.

| Role  | Username | Password      |
| ----- | -------- | ------------- |
| Admin | —        | AdminPass123! |
| User  | testuser | Test1234!     |

> To start from a blank state (e.g. to test the setup wizard), use the `POST /__reset` endpoint
> (called automatically by Playwright tests in their `beforeEach`).
