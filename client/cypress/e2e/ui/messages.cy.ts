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

function getTimeStamp() {
  return new Date().getTime()
}

beforeEach(() => {
  cy.loginViaUI()
})

describe('Message UI tests', () => {
  it('Time Display', () => {
    cy.sendMessageWithUi('Hello this is a test message')
    const regex = new RegExp('^[0-9]{1,2}\\:[0-9]{2}\\ (am|pm)$')
    cy.get('[data-cy="message-sent-time"]').first().invoke('text').should('match', regex)
  })
  it('Message Status Icon', () => {
    cy.sendMessageWithUi('Hello this is a test status message')
    cy.get('[data-cy="message-status-icon"]').should('be.visible')
  })
  it('Message Reply', () => {
    const text = 'Hello this is a test reply message ' + getTimeStamp()
    const reply = 'Hello this is a test reply message reply ' + getTimeStamp()
    cy.sendMessageWithUi(text)
    cy.replyToMessageWithUi(text, reply)
    cy.get('[data-cy = "message"]').first().contains(reply).get('[data-cy="reply-message"]').should('be.visible')
  })
  it('Message Edit', () => {
    const text = 'Hello this is a edit message ' + getTimeStamp()
    const edit = 'Hello this is a edit message edited ' + getTimeStamp()
    cy.sendMessageWithUi(text)
    cy.editMessageWithUi(text, edit)
    cy.get('[data-cy = "message"]').first().contains(edit).get('[data-cy="edited-message"]').should('be.visible')
  })
  it('Message Reaction', () => {
    const text = 'Hello this is a reaction message ' + getTimeStamp()
    const emojiTitle = 'grinning'
    const emoji = '😀'
    cy.sendMessageWithUi(text)
    cy.reactToMessageWithUi(text, emojiTitle)
    cy.get('[data-cy="emoji-reaction-list"]').should('be.visible').contains(emoji)
  })
})
