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
import { OpenIdProviders } from '../storage/openid-providers.js'
import { signJwt, signJwtWithExpiration } from '../utils/jwt.js'
import { exchangeCodeForToken, exchangeTokenForUserInfo, getBase64Picture, getJwt } from '../utils/openid.js'

const jamid = Container.get(Jamid)
const accounts = Container.get(Accounts)

const config = Container.get(AdminAccount)
const providers = Container.get(OpenIdProviders)
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

    try {
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
            res.status(HttpStatusCode.InternalServerError).send('Error registering username')
        }
        return
      }
    } catch (e: any) {
      console.error(e)
      res.status(HttpStatusCode.InternalServerError).send(e.message)
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

    if (authMethod === 'guest') {
      const { accountId } = await jamid.addAccount({})
      const details = jamid.getAccountDetails(accountId)
      const username = details['Account.username']
      const jwt = await signJwtWithExpiration(accountId, '2h')
      const sessionTime = 2 * 60 * 60 * 1000
      const date = Date.now() + sessionTime
      accounts.set(username, date.toString(), 'guest')
      accounts.save()
      res.send({ accessToken: jwt })
      setTimeout(() => {
        clearGuest(accountId, username)
      }, sessionTime)
      return
    }

    if (username === undefined || password === undefined) {
      res.status(HttpStatusCode.BadRequest).send('Missing username or password in body')
      return
    }
    // Check if the account is stored on this daemon instance
    if (authMethod === 'jams') {
      //When the user logs in for the first time, we need to set up their account by assigning the relevant details:

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

      if (typeof data === 'object' && !('password' in data)) {
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

authRouter.post(
  '/guest/extend',
  asyncHandler(async (req, res) => {
    // extend the token for 24h
    const accountId = res.locals.accountId
    const details = jamid.getAccountDetails(accountId)
    const username = details['Account.username']
    const jwt = await signJwtWithExpiration(accountId, '2h')
    const date = Date.now() + 2 * 60 * 60 * 1000
    accounts.set(username, date.toString(), 'guest')
    accounts.save()
    res.send({ accessToken: jwt })
  }),
)

function clearGuest(accId: string, username: string) {
  const guests = accounts.getGuests()
  if (guests[username] !== undefined) {
    const date = Number(guests[username])
    if (date < Date.now()) {
      jamid.removeAccount(accId)
      accounts.remove(username, 'guest')
      accounts.save()
      return
    }
    setTimeout(() => {
      clearGuest(accId, username)
    }, date - Date.now())
  }
}
/*
 *  OAUTH2 FLOW WITH ANY PROVIDER
 */

authRouter.get(
  '/oauth/providers',
  asyncHandler(async (req, res) => {
    const protocol = req.secure ? 'https' : 'http'
    const host = req.get('host')
    const baseUrl = `${protocol}://${host}`
    const urls = providers.getAllAuthorizeUrls()
    const array = []
    for (const [provider, url] of urls) {
      const displayName = providers.getDisplayName(provider)
      const icon = providers.getIcon(provider)
      const colorTheme = providers.getColorTheme(provider)
      const redirectUri = url + '&redirect_uri=' + baseUrl + providers.getRedirectUri(provider)
      array.push({ provider, displayName, icon, colorTheme, redirectUri })
    }
    res.send(array)
  }),
)

authRouter.get(
  '/oauth/:provider/callback',
  asyncHandler(async (req, res) => {
    const devMode = process.env.NODE_ENV === 'development'
    const provider = req.params.provider
    const supportedProviders = providers.getOpenIdProvidersNames()
    const configuredProviders = config.getOpenIdProvidersNames()
    const code = req.query.code

    const protocol = req.secure ? 'https' : 'http'
    const host = req.get('host')
    const baseUrl = `${protocol}://${host}`

    const loginUrl = devMode ? 'http://localhost:3000/login' : baseUrl + '/login'

    if (!provider) {
      res.status(HttpStatusCode.BadRequest).send('Missing provider in path')
      res.redirect(loginUrl)
      return
    }

    if (!supportedProviders.includes(provider)) {
      res.status(HttpStatusCode.BadRequest).send('Unsupported provider')
      res.redirect(loginUrl)
      return
    }

    if (!configuredProviders.includes(provider)) {
      res.status(HttpStatusCode.BadRequest).send('Provider not configured')
      res.redirect(loginUrl)
      return
    }

    if (!code) {
      res.status(HttpStatusCode.BadRequest).send('Missing code in query parameters')
      res.redirect(loginUrl)
      return
    }

    const isActive = config.isProviderActive(provider)

    if (!isActive) {
      res.status(HttpStatusCode.BadRequest).send('Provider is not active')
      res.redirect(loginUrl)
      return
    }

    const data = await exchangeCodeForToken(code as string, provider, baseUrl)
    if (data === undefined) {
      res.status(HttpStatusCode.BadRequest).send('Invalid code')
      res.redirect(loginUrl)
      return
    }

    let accessToken = data.access_token

    if (typeof data === 'string' && data.includes('&')) {
      const line = data.split('&')
      for (const item of line) {
        if (item.includes('access_token')) {
          accessToken = item.replace('access_token=', '')
          break
        }
      }
    }

    const userInfo = await exchangeTokenForUserInfo(accessToken, provider)

    if (userInfo === undefined) {
      res.status(HttpStatusCode.BadRequest).send('Invalid token')
      res.redirect(loginUrl)
      return
    }

    const name = userInfo.name

    let key

    const email = userInfo.email
    const emailVerified = userInfo.email_verified
    const sub = userInfo.sub !== undefined ? String(userInfo.sub) : undefined
    const id = userInfo.id !== undefined ? String(userInfo.id) : undefined

    key = email
    if (!email || (emailVerified && emailVerified === false)) {
      if (sub) {
        key = sub
      } else if (id) {
        key = id
      } else {
        // if no email, sub or id, we cannot use this provider
        res.status(HttpStatusCode.BadRequest).send('Cannot use this provider')
        res.redirect(loginUrl)
        return
      }
    }

    // this duplicates the account storage for the same user but
    // ensure that the user can login with any of the keys

    function fallBack(key: string, from: string) {
      const account = accounts.getOpenIdAccount(key)
      if (account !== undefined && from && accounts.getOpenIdAccount(from) === undefined) {
        accounts.set(from, { accountId: account.accountId, service: [provider] }, 'openid') // now the user can cannot using either the sub or the email
        accounts.save()
      }
    }

    if (sub) {
      fallBack(sub, email)
    }
    if (id) {
      fallBack(id, email)
    }

    if (email) {
      if (emailVerified && emailVerified === false) {
        // we cannot use the mail as key to access
        // the account
        return
      }
      if (sub) {
        fallBack(email, sub)
      }
      if (id) {
        fallBack(email, id)
      }
    }

    const jwt = await getJwt(key, name, provider)
    if (jwt === 'INVALID') {
      res.redirect(loginUrl)
      return
    }

    const account = accounts.getOpenIdAccount(key)

    if (userInfo.picture) {
      const base64Img = await getBase64Picture(userInfo.picture)
      jamid.updateProfile(account.accountId, name, base64Img, 'PNG', 1)
    }
    if (userInfo.avatar_url) {
      const base64Img = await getBase64Picture(userInfo.avatar_url)
      jamid.updateProfile(account.accountId, name, base64Img, 'PNG', 1)
    }

    res.redirect(loginUrl + '?accessToken=' + jwt)
  }),
)
