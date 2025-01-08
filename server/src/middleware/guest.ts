/*
 * Copyright (C) 2022-2025 Savoir-faire Linux Inc.
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
import { NextFunction } from 'express'
import { Container } from 'typedi'

import { Jamid } from '../jamid/jamid.js'
import { Accounts } from '../storage/accounts.js'

const jamid = Container.get(Jamid)
const accounts = Container.get(Accounts)

export const extendIfGuest = function (req: any, res: any, next: NextFunction) {
  const accountId = res.locals.accountId
  if (accountId === undefined) {
    next()
    return
  }
  const details = jamid.getAccountDetails(accountId)
  if (details === undefined) {
    next()
    return
  }
  const username = details['Account.username']
  if (username === undefined) {
    next()
    return
  }
  accounts.extendSessionIfGuest(username)
  next()
}
