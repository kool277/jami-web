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
import argon2 from 'argon2'
import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { ParamsDictionary, Request } from 'express-serve-static-core'
import { AccessToken, AccountDetails, HttpStatusCode, UserCredentials } from 'jami-web-common'
import { Container } from 'typedi'

import { Jamid } from '../jamid/jamid.js'
import { NameRegistrationEndedState, RegistrationState } from '../jamid/state-enums.js'
import { Accounts } from '../storage/accounts.js'
import { AdminAccount } from '../storage/admin-account.js'
import { signJwt } from '../utils/jwt.js'

const jamid = Container.get(Jamid)
const accounts = Container.get(Accounts)

const config = Container.get(AdminAccount)
export const authRouter = Router()

authRouter.post(
  '/new-account',
  asyncHandler(async (req: Request<ParamsDictionary, string, Partial<UserCredentials>>, res) => {
    const { username, password } = req.body
    if (username === undefined || password === undefined) {
      res.status(HttpStatusCode.BadRequest).send('Missing username or password in body')
      return
    }
    const isAccountAlreadyCreated = accounts.get(username) !== undefined
    if (isAccountAlreadyCreated) {
      res.status(HttpStatusCode.Conflict).send('Username already exists locally')
      return
    }
    if (password === '') {
      res.status(HttpStatusCode.BadRequest).send('Password may not be empty')
      return
    }
    const hashedPassword = password ? await argon2.hash(password, { type: argon2.argon2id }) : ''
    const accountDetails: Partial<AccountDetails> = {
      // TODO: Enable encrypted archives
      // 'Account.archivePassword': password
    }

    const nameserver = config.getNameServerAddress()

    if (nameserver !== '') {
      accountDetails['RingNS.uri'] = nameserver
    }
    const { accountId } = await jamid.addAccount(accountDetails)

    const state = await jamid.registerUsername(accountId, username, '')
    if (state !== NameRegistrationEndedState.Success) {
      jamid.removeAccount(accountId)
      switch (state) {
        case NameRegistrationEndedState.InvalidName:
          res.status(HttpStatusCode.BadRequest).send('Invalid username or password')
          break
        case NameRegistrationEndedState.AlreadyTaken:
          res.status(HttpStatusCode.Conflict).send('Username already exists')
          break
        default:
          throw new Error(`Unhandled state ${state}`)
      }
      return
    }
    try {
      accounts.set(username, hashedPassword, 'local')
      await accounts.save()
      res.sendStatus(HttpStatusCode.Created)
    } catch (e: any) {
      console.error(e)
      res.status(HttpStatusCode.InternalServerError).send(e.message)
    }
  }),
)
authRouter.post(
  '/login',
  asyncHandler(async (req: Request<ParamsDictionary, AccessToken | string, Partial<UserCredentials>>, res) => {
    const { username, password, authMethod } = req.body

    if (username === undefined || password === undefined) {
      res.status(HttpStatusCode.BadRequest).send('Missing username or password in body')
      return
    }
    // Check if the account is stored on this daemon instance
    if (authMethod === 'jams') {
      //When the user logs in for the first time, we need to set up their account by assigning the relevant details:

      //accountDetails['Account.managerUri'] = config.getJamsServerUrl()
      //accountDetails['Account.managerUsername'] = username
      //accountDetails['Account.archivePassword'] = password

      //This sets the Jams Server URL (managerUri) and sends a request to add the account using addAccount.
      //If the registrationState is valid, the account is created in the daemon, and both the hashed password and login are stored in accounts.json.

      //For future logins, the user will be authenticated using these stored values.

      const accountDetails: Partial<AccountDetails> = {
        // TODO: Enable encrypted archives
        // 'Account.archivePassword': password
      }
      accountDetails['Account.managerUri'] = config.getJamsServerUrl()
      accountDetails['Account.managerUsername'] = username
      accountDetails['Account.archivePassword'] = password

      // same password we need to connect the user to the account
      const data = accounts.get(username, 'jams')

      if (data === undefined || typeof data === 'string') {
        // we need to create a new account
        const { accountId: JAMSAccountId, state } = await jamid.addAccount(accountDetails)
        if (state === RegistrationState.ErrorGeneric) {
          jamid.removeAccount(JAMSAccountId)
          res.status(HttpStatusCode.Unauthorized).send('Invalid JAMS credentials')
        } else {
          const hashedPassword = await argon2.hash(password, { type: argon2.argon2id })
          try {
            accounts.set(username, hashedPassword, authMethod, JAMSAccountId)
            await accounts.save()
            // now we need to get the accountId from the username and return it
            const jwt = await signJwt(JAMSAccountId)
            res.status(HttpStatusCode.Ok).send({ accessToken: jwt })
          } catch (e: any) {
            console.error(e)
            res.status(HttpStatusCode.InternalServerError).send(e.message)
          }
        }
        return
      }

      if (data.password === undefined) {
        res.status(HttpStatusCode.NotFound).send('Password not found')
        return
      }

      const isPasswordVerified = await argon2.verify(data.password, password)
      if (!isPasswordVerified) {
        res.status(HttpStatusCode.Unauthorized).send('Incorrect password')
        return
      }
      const JAMSAccountId = data.accountId
      if (JAMSAccountId === undefined) {
        res.status(HttpStatusCode.NotFound).send('Username not found')
        return
      }
      const jwt = await signJwt(JAMSAccountId)
      res.status(HttpStatusCode.Ok).send({ accessToken: jwt })
      return
    } else if (authMethod === 'local') {
      const accountId = jamid.getAccountIdFromUsername(username)
      if (accountId === undefined) {
        res.status(HttpStatusCode.NotFound).send('Username not found')
        return
      }
      const hashedPassword = accounts.get(username, 'local')
      if (hashedPassword === undefined || typeof hashedPassword !== 'string') {
        res
          .status(HttpStatusCode.Unauthorized)
          .send('Password not found (the account does not have a password set on the server)')
        return
      }
      const isPasswordVerified = await argon2.verify(hashedPassword, password)
      if (!isPasswordVerified) {
        res.status(HttpStatusCode.Unauthorized).send('Incorrect password')
        return
      }
      const jwt = await signJwt(accountId)
      res.status(HttpStatusCode.Ok).send({ accessToken: jwt })
    }
  }),
)
