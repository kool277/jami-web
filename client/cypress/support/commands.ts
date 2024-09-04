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

/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

/*
    ATTENTION: Add the custom command in the declaration file before adding its implementation here.
    Do not put the declaration and the implementation in the same file as such code organization is disallowed by the plugin @typescript-eslint/no-namespace
*/

Cypress.Commands.add('loginViaUI', () => {
  cy.visit(Cypress.env('CLIENT_URL'))

  cy.url().should('include', '/login')

  cy.get('[data-cy = "username-input"]')
    .type(Cypress.env('TEST_USERNAME'))
    .find('input')
    .should('have.value', Cypress.env('TEST_USERNAME'))

  cy.get('[data-cy = "password-input"]')
    .type(Cypress.env('TEST_USER_PASSWORD'))
    .find('input')
    .should('have.value', Cypress.env('TEST_USER_PASSWORD'))

  cy.get('[data-cy="login-button"]').contains('Log in').click()

  cy.url().should('include', '/conversation')
})

Cypress.Commands.add('loginWithoutUI', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('SERVER_URL')}/auth/login`,
    body: {
      username: Cypress.env('TEST_USERNAME'),
      password: Cypress.env('TEST_USER_PASSWORD'),
      isJams: false,
    },
  }).then((response) => {
    const accessToken = response.body.accessToken

    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', accessToken)
      cy.log(accessToken)
    })
  })

  cy.visit(`${Cypress.env('CLIENT_URL')}/conversation`)

  cy.get('[data-cy = "menu-button"]').should('exist')
})

Cypress.Commands.add('logoutViaUI', () => {
  cy.window().then((win) => {
    expect(win.localStorage.getItem('accessToken')).to.not.equal(null)
    cy.log('Access token exists')
  })

  cy.get('[data-cy = "menu-button"]')
    .click()
    .then(() => {
      cy.get('[data-cy = "logout-button"]').contains('Log out').click()

      cy.url().should('include', '/login')

      cy.get('[data-cy="login-button"]').should('exist')
    })
})

Cypress.Commands.add('sendMessageWithUi', (text: string) => {
  cy.get('[data-cy = "conversation-summary-item"]').first().click()

  cy.get('[data-cy = "message-input"]').type(text).find('input').should('have.value', text)

  cy.get('[type="submit"]').click()
})

Cypress.Commands.add('reactToMessageWithUi', (text: string, emojiTitle: string) => {
  cy.get('[data-cy = "conversation-summary-item"]').first().click()
  cy.get('[data-cy = "message"]').first().contains(text).trigger('mouseover')
  cy.get('[data-cy = "emoji-reaction-button"]').click()
  cy.get('[alt="' + emojiTitle + '"]').click()
})

Cypress.Commands.add('replyToMessageWithUi', (text: string, reply: string) => {
  cy.get('[data-cy = "conversation-summary-item"]').first().click()
  cy.get('[data-cy = "message"]').first().contains(text).trigger('mouseover')
  cy.get('[data-cy = "reply-button"]').click()
  cy.get('[data-cy = "message-input"]').type(reply).find('input').should('have.value', reply)
  cy.get('[type="submit"]').click()
})

Cypress.Commands.add('editMessageWithUi', (text: string, edit: string) => {
  cy.get('[data-cy = "conversation-summary-item"]').first().click()
  cy.get('[data-cy = "message"]').first().contains(text).trigger('mouseover')
  cy.get('[data-cy = "edit-button"]').click()
  cy.get('[data-cy = "message-input"]').clear().type(edit).find('input').should('have.value', edit)
  cy.get('[type="submit"]').click()
})
