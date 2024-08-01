/*
 * Copyright (C) 2022 Savoir-faire Linux Inc.
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

describe('registration', () => {
  beforeEach(() => {
    cy.visit(Cypress.env('CLIENT_URL'))

    cy.url().should('include', '/login')

    cy.get('[data-cy = "register-link"]').click()

    cy.url().should('include', '/register')
  })

  it('register successfully', () => {
    const randomId = Date.now()

    ///^[a-zA-Z0-9-_]{3,32}$/ from client/src/utils/constants.ts
    //TODO: Make a cypress custom command that generates a valid usernames as well as one generating an invalid one
    cy.get('[data-cy = "username-input"]')
      .type(`test-user-${randomId}`)
      .find('input')
      .should('have.value', `test-user-${randomId}`)

    cy.get('[data-cy = "username-input"]').find('[id$=-helper-text]').contains('Username available')

    //TODO: Make a cypress custom command that generates a valid password (that is strong determined by passwordStrength() from npm module `check-password-strength`) as well as one generating an invalid one
    cy.get('[data-cy = "password-input"]')
      .type(`Test-user-${randomId}`)
      .find('input')
      .should('have.value', `Test-user-${randomId}`)
    //TODO: uncomment the following code when the UI implements the input field for password repeat
    // cy.get('[data-cy = "password-repeat-input"]').type(`Test/user/${randomId}`).should('have.value', `Test/user/${randomId}`);

    cy.get('[data-cy = "password-input"]').find('[id$=-helper-text]').contains('Strong')

    cy.get('[data-cy = "register-button"]')
      .click()
      .then(() => {
        cy.wait(3000) //the reigstration process takes longer than cypress default timeout

        cy.url().should('include', '/conversation')
      })
  })

  it('registration fails with username taken', () => {
    const randomId = Date.now()

    cy.get('[data-cy = "username-input"]')
      .type(Cypress.env('USED_USERNAME'))
      .find('input')
      .should('have.value', Cypress.env('USED_USERNAME'))

    cy.get('[data-cy = "username-input"]').find('[id$=-helper-text]').contains('Username already taken')

    cy.get('[data-cy = "password-input"]')
      .type(`Test-user-${randomId}`)
      .find('input')
      .should('have.value', `Test-user-${randomId}`)
    //TODO: uncomment the following code when the UI implements the input field for password repeat
    // cy.get('[data-cy = "password-repeat-input"]').type(`Test/user/${randomId}`).should('have.value', `Test/user/${randomId}`);

    cy.get('[data-cy = "register-button"]').should('have.attr', 'disabled')
  })
})
