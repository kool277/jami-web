# Tests With Cypress (In progress)

---

**Table of Content**

- [Tests With Cypress (In progress)](#tests-with-cypress-in-progress)
  - [Prerequisites](#prerequisites)
  - [Test Platforms](#test-platforms)
  - [Test Environment Variables](#test-environment-variables)
  - [Test Flow](#test-flow)
    - [Success Login](#success-login)
    - [Success Logout](#success-logout)
    - [Registration](#registration)
    - [Toggle Rendez-Vous Point](#toggle-rendez-vous-point)
    - [Toggle Allow Connection From Unknown Peers](#toggle-allow-connection-from-unknown-peers)
    - [Conversation](#conversation)
    - [Current Calls](#current-calls)
    - [Change Account](#change-account)
    - [Add Moderators](#add-moderators)
    - [Search Contact](#search-contact)

## Prerequisites

---

> Check [here](https://github.com/cypress-io/cypress) about Cypress and the required Node version for the scripts to run successfully. This may vary depending on which version of Cypress is installed.

## Test Platforms

---

- Chrome web
- Firefox web

## Test Environment Variables

Environment variables can be different across different machines. Machine specific variables should be defined in `cypress.env.json` whereas the shared variables should be defined in the `cypress.config.ts` because it is tracked by git. For more, See [docs](https://docs.cypress.io/guides/guides/environment-variables).

Before running any tests, make sure all the variables are set correctly in `cypress.env.json`. Refer to `cypress.env.example.json` for what variables are needed.

## Test Flow

---

### Success Login

**Description**
Users should be able to access their Jami-web accounts through the login page by entering the correct credentials.

**Steps**

- Visit root path `/`
- The page should redirect to `/login` if the admin is set up
- Find input fields and type in credentials
- Press the `Log In` button
- Wait until the page transition finishes
- Check URL, expected path: `/conversation`
- `To be discussed`

### Success Logout

**Description**
Users should be able to safely log out their Jami-web accounts through the menu by clicking the `Log Out` button. The access to the protected pages are denied and the users should be redirected to the login page.

**Steps**

- [Login Locally](#login-locally)
- Find and click the `menu` button
- Find and click the `Log Out` button
- Check URL, expected path: `/login`
- The login form should appear
- Refresh the page
- The page should redirect to `/login`
- Visit all protected routes
- The page should redirect to `/login`

### Registration

**Description**
Users should be able to create their Jami-web accounts through the registration page by providing the required info.

**Steps**

- Visit root path `/`
- The page should redirect to `/login` if the admin is set up
- Find and click the `register` link
- Check URL, expected path: `/register`
- Find input fields and type in credentials
- Find and click the `register` button
- Wait until the page transition finishes
- Check URL, expected path: `/conversation`
- `To be discussed`

### Toggle Rendez-Vous Point

- `To be discussed`

### Toggle Allow Connection From Unknown Peers

- `To be discussed`

### Conversation

- `To be discussed`

- #### Send Text To A Contact

  - `To be discussed`

- #### Send File To A Contact

  - `To be discussed`

- #### Video Call

  - `To be discussed`

- #### Voice Message

  - `To be discussed`

- #### Send Emoji To A Contact
  - `To be discussed`

### Current Calls

- `To be discussed`

### Change Account

- `To be discussed`

### Add Moderators

- `To be discussed`

### Search Contact

- `To be discussed`
