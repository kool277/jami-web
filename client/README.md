# Client

## Setup

```
npm install
```

## Usage

### Run with hot-reload for development

```
npm start
```

Open <http://localhost:3000> in your browser to view the app.

### Build for production

```
npm run build
```

### Preview the production build

```
npm run start:prod
```

### Run tests

Run Cypress tests headlessly:

```
npm run cypress
```

Run Cypress tests with the browser:

```
npm run cypress:open
```

To overide configurations without modifying the existing config file:

```
npx cypress run --config <config>
```

[Reference](https://docs.cypress.io/guides/references/configuration)

Alternatively, you can create your own local config file and use the following command:

```
npx cypress run --config-file <config-file>
```

Remember do not push this file to the source control if not needed.

### Test variables

You must provide the following variables in either `cypress.config.ts` or `cypress.env.json`

```
SERVER_URL
CLIENT_URL
TEST_USERNAME
TEST_USER_PASSWORD
USED_USERNAME
```

Check [here](https://docs.cypress.io/guides/guides/environment-variables) to see how to set the environment variables. For local testing, modify the variables in `cypress.env.json` since it is not tracked and variables defined here take precedence over the ones in the config file.

### Lint files

```
npm run lint
```

Lint and fix files:

```
npm run lint:fix
```

### Format files

```
npm run format
```

### Clean build output

```
npm run clean
```

### Update the translation files

```
npm run extract-translations
```

The translations are handled by [i18next](https://www.i18next.com/).

### Sentry

- Uncomment the line `// import config from "./sentry-server.config.json" assert { type: "json" };` in `sentry.js`
- Uncomment the line `// import config from "../sentry-client.config.json"` and the init config `Sentry.init(...` in `index.ts`
- Add `sentry-client.config.json` file in `client` and `sentry-server.config.json` (ask them to an admin)
