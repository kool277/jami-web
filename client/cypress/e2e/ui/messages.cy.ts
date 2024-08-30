/*
 * Copyright (C) 2024 Savoir-faire Linux Inc.
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

describe('Message UI tests', () => {
  it('Time Display', () => {
    cy.sendMessageWithUi()
    const regex = new RegExp('^[0-9]{1,2}\\:[0-9]{2}\\ (am|pm)$')
    cy.get('[data-cy="message-sent-time"]').first().invoke('text').should('match', regex)
  })
  it('Message Status Icon', () => {
    cy.sendMessageWithUi()
    cy.get('[data-cy="message-status-icon"]').should('be.visible')
  })
})
