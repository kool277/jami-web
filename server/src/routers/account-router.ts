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
import { Request, Router } from 'express'
import asyncHandler from 'express-async-handler'
import { ParamsDictionary } from 'express-serve-static-core'
import { AccountDetails, HttpStatusCode, IAccount, IContact } from 'jami-web-common'
import { Container } from 'typedi'

import { Jamid } from '../jamid/jamid.js'
import { authenticateToken } from '../middleware/auth.js'
import { AdminAccount } from '../storage/admin-account.js'

const jamid = Container.get(Jamid)
const config = Container.get(AdminAccount)
export const accountRouter = Router()

accountRouter.use(authenticateToken)

// TODO: Do we really need this route to return the default moderators?
// It would be cleaner just to GET /default-moderators for this
accountRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const accountId = res.locals.accountId
    const nameserver = config.getNameServerAddress()
    // Add usernames for default moderators
    const defaultModeratorUris = jamid.getDefaultModeratorUris(accountId)
    const namedDefaultModerators: IContact[] = []
    for (const defaultModeratorUri of defaultModeratorUris) {
      const { username } = await jamid.lookupAddress(defaultModeratorUri, nameserver, accountId)
      namedDefaultModerators.push({
        uri: defaultModeratorUri,
        registeredName: username,
      })
    }

    const account: IAccount = {
      id: accountId,
      details: jamid.getAccountDetails(accountId),
      volatileDetails: jamid.getVolatileAccountDetails(accountId),
      defaultModerators: namedDefaultModerators,
      devices: jamid.getDevices(accountId),
    }
    res.send(account)
  }),
)

accountRouter.patch('/', (req: Request<ParamsDictionary, string, Partial<AccountDetails>>, res) => {
  const accountId = res.locals.accountId

  if (typeof accountId !== 'string') {
    res.sendStatus(HttpStatusCode.BadRequest)
    return
  }

  const currentAccountDetails = jamid.getAccountDetails(accountId)
  const newAccountDetails: AccountDetails = { ...currentAccountDetails, ...req.body }
  jamid.setAccountDetails(accountId, newAccountDetails)

  res.sendStatus(HttpStatusCode.NoContent)
})

accountRouter.post(
  '/:deviceId/revoke',
  asyncHandler(async (req, res) => {
    const accountId = res.locals.accountId
    const deviceId = req.params.deviceId
    const password = req.body.password
    const scheme = req.body.scheme

    const value = jamid.revokeDevice(accountId, deviceId, scheme, password)
    if (!value) {
      res.status(HttpStatusCode.BadRequest).send('Failed to revoke device')
      return
    }
    res.sendStatus(HttpStatusCode.Ok)
  }),
)

accountRouter.post('/displayName/reset', (req, res) => {
  const accountId = res.locals.accountId
  const account = jamid.getAccountDetails(accountId)

  if (account['Account.displayName'] === account['Account.username']) {
    res.sendStatus(HttpStatusCode.Ok)
    return
  }

  const accountDetails = jamid.getAccountDetails(accountId)
  const volatileDetails = jamid.getVolatileAccountDetails(accountId)

  accountDetails['Account.displayName'] = volatileDetails['Account.registeredName']
  jamid.setAccountDetails(accountId, accountDetails)

  res.sendStatus(HttpStatusCode.NoContent)
})

accountRouter.post('/displayName', (req, res) => {
  const accountId = res.locals.accountId
  const displayName = req.body.displayName

  const accountDetails = jamid.getAccountDetails(accountId)
  accountDetails['Account.displayName'] = displayName
  jamid.setAccountDetails(accountId, accountDetails)

  res.sendStatus(HttpStatusCode.NoContent)
})
