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

describe('authentication', () => {
  beforeEach(() => {});

  it('log in and log out successfully', () => {
    cy.visit(Cypress.env('CLIENT_URL'));

    cy.url().should('include', '/login');

    cy.get('[data-cy = "username-input"]')
      .type(Cypress.env('TEST_USERNAME'))
      .find('input')
      .should('have.value', Cypress.env('TEST_USERNAME'));

    cy.get('[data-cy = "password-input"]')
      .type(Cypress.env('TEST_USER_PASSWORD'))
      .find('input')
      .should('have.value', Cypress.env('TEST_USER_PASSWORD'));

    cy.get('[data-cy="login-button"]').contains('Log in').click();

    cy.url().should('include', '/conversation');

    cy.get('[data-cy = "menu-button"]').should('exist');

    cy.get('[data-cy = "menu-button"]')
      .click()
      .then(() => {
        cy.get('[data-cy = "logout-button"]').contains('Log out').click();

        cy.url().should('include', '/login');

        cy.get('[data-cy="login-button"]').should('exist');
      });
  });
});
