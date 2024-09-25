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
import { ParamsDictionary, Request, Response } from 'express-serve-static-core'
import { readdir, stat } from 'fs/promises'
import { AccessToken, AccountOverview, AdminCredentials, HttpStatusCode } from 'jami-web-common'
import os from 'os'
import path from 'path'
import { Container } from 'typedi'

import { Jamid } from '../jamid/jamid.js'
import { adminAuthenticationMiddleware } from '../middleware/auth.js'
import { checkAdminSetup } from '../middleware/setup.js'
import { Accounts } from '../storage/accounts.js'
import { AdminAccount } from '../storage/admin-account.js'
import { isConfigValid } from '../utils/admin.js'
import { signJwt } from '../utils/jwt.js'

const jamid = Container.get(Jamid)
const adminAccount = Container.get(AdminAccount)
const accounts = Container.get(Accounts)

export const adminRouter = Router()

adminRouter.get('/check', (_req, res) => {
  const isSetupComplete = adminAccount.getPasswordHash() !== undefined
  res.send({ isSetupComplete })
})

adminRouter.post(
  '/create',
  asyncHandler(async (req: Request<ParamsDictionary, string, Partial<AdminCredentials>>, res) => {
    const { password } = req.body
    if (password) {
      const hashedPassword = await argon2.hash(password, { type: argon2.argon2id })

      adminAccount.setPasswordHash(hashedPassword)
      await adminAccount.save()

      res.sendStatus(HttpStatusCode.Created)
      return
    }

    res.status(HttpStatusCode.BadRequest).send('Invalid password')
  }),
)
//Requests below require a successful setup
adminRouter.use(checkAdminSetup)

adminRouter.post(
  '/login',
  asyncHandler(async (req: Request<ParamsDictionary, AccessToken | string, Partial<AdminCredentials>>, res) => {
    const { password } = req.body
    if (password === undefined) {
      res.status(HttpStatusCode.BadRequest).send('Missing password in body')
      return
    }

    const hashedPassword = adminAccount.getPasswordHash()
    if (hashedPassword === undefined) {
      res.status(HttpStatusCode.InternalServerError).send('Admin password not found')
      return
    }

    const isPasswordVerified = await argon2.verify(hashedPassword, password)
    if (!isPasswordVerified) {
      res.status(HttpStatusCode.Unauthorized).send('Incorrect password')
      return
    }

    const jwt = await signJwt('admin')
    res.send({ accessToken: jwt })
  }),
)

adminRouter.get(
  '/config',
  asyncHandler(async (_, res: Response) => {
    const config = adminAccount.getConfig()
    if (config !== undefined) {
      res.status(HttpStatusCode.Ok).send(config)
      return
    }
    console.log(config)
    res.sendStatus(HttpStatusCode.InternalServerError)
  }),
)

//Requests below require authentication
adminRouter.use(adminAuthenticationMiddleware)

adminRouter.get(
  '/isTokenValid',
  asyncHandler(async (_, res: Response) => {
    // If the request reaches this point, the token is valid
    // The token is verified by the adminAuthenticationMiddleware
    res.sendStatus(HttpStatusCode.Ok)
  }),
)

adminRouter.patch(
  '/config',
  asyncHandler(async (req: Request<ParamsDictionary, unknown, unknown>, res: Response) => {
    const config = req.body

    if (!isConfigValid(config)) {
      res.status(HttpStatusCode.BadRequest).send('Invalid config in the payload')
      return
    }
    adminAccount.updateConfig(config)
    try {
      await adminAccount.save()
      res.sendStatus(HttpStatusCode.Ok)
    } catch (e) {
      res.sendStatus(HttpStatusCode.InternalServerError)
    }
  }),
)

//Requests below require authentication
adminRouter.use(adminAuthenticationMiddleware)

adminRouter.patch(
  '/password',
  asyncHandler(async (req, res) => {
    const newPassword = req.body.new
    const oldPassword = req.body.old

    const oldPasswordHash = adminAccount.getPasswordHash()
    if (oldPasswordHash === undefined) {
      res.status(HttpStatusCode.InternalServerError).send('Admin password not found')
      return
    }

    const isPasswordVerified = await argon2.verify(oldPasswordHash, oldPassword)
    if (!isPasswordVerified) {
      res.status(HttpStatusCode.Unauthorized).send('Incorrect password')
      return
    }

    if (newPassword === undefined) {
      res.status(HttpStatusCode.BadRequest).send('Missing password in body')
      return
    }
    if (newPassword) {
      try {
        const hashedPassword = await argon2.hash(newPassword, { type: argon2.argon2id })
        adminAccount.setPasswordHash(hashedPassword)
        await adminAccount.save()
        res.sendStatus(HttpStatusCode.Ok)
        return
      } catch (e) {
        res.sendStatus(HttpStatusCode.InternalServerError)
        return
      }
    }
    res.sendStatus(HttpStatusCode.BadRequest)
  }),
)

adminRouter.patch(
  '/config',
  asyncHandler(async (req: Request<ParamsDictionary, unknown, unknown>, res: Response) => {
    const config = req.body

    if (!isConfigValid(config)) {
      res.status(HttpStatusCode.BadRequest).send('Invalid config in the payload')
      return
    }
    adminAccount.updateConfig(config)
    try {
      await adminAccount.save()
      res.sendStatus(HttpStatusCode.Ok)
    } catch (e) {
      res.sendStatus(HttpStatusCode.InternalServerError)
    }
  }),
)

adminRouter.post(
  '/nameserver',
  asyncHandler(async (req, res) => {
    const nameserver = req.body.nameserver
    // create JSON file is not exists and set the name server address in it
    // replace it if it exists
    // this overrides the default name server address in the daemon
    // https://ns.jami.net

    if (!nameserver || nameserver === '') {
      res.status(HttpStatusCode.BadRequest).send('Nameserver not provided')
      return
    }
    if (!/^(http(s)?:\/\/)?([a-zA-Z0-9\-.]+)(:\d{1,5})?(\/.*)?$/g.test(nameserver)) {
      res.status(HttpStatusCode.BadRequest).send('Invalid nameserver')
      return
    }
    adminAccount.setNameServerAdress(nameserver)
    adminAccount.save()
    res.sendStatus(HttpStatusCode.Ok)
  }),
)

adminRouter.delete(
  '/nameserver',
  asyncHandler(async (req, res) => {
    adminAccount.resetNameServerAdress()
    adminAccount.save()
    res.sendStatus(HttpStatusCode.Ok)
  }),
)

adminRouter.get(
  '/nameserver',
  asyncHandler(async (req, res) => {
    const nameserver = adminAccount.getNameServerAddress()
    if (nameserver === '') {
      // default name server address
      res.send('https://ns.jami.net')
      return
    }
    res.send(nameserver)
  }),
)

adminRouter.post(
  '/jamsurl',
  asyncHandler(async (req, res) => {
    const jamsUrl = req.body.url

    if (!jamsUrl || jamsUrl === '') {
      res.status(HttpStatusCode.BadRequest).send('Nameserver not provided')
      return
    }
    if (!/^(http(s)?:\/\/)?([a-zA-Z0-9\-.]+)(:\d{1,5})?(\/.*)?$/g.test(jamsUrl)) {
      res.status(HttpStatusCode.BadRequest).send('Invalid url')
      return
    }
    adminAccount.setJamsServerUrl(jamsUrl)
    adminAccount.save()
    res.sendStatus(HttpStatusCode.Ok)
  }),
)

adminRouter.delete(
  '/jamsurl',
  asyncHandler(async (req, res) => {
    adminAccount.resetJamsServerUrl()
    adminAccount.save()
    adminAccount.updateConfig({ jamsAuthEnabled: false })
    res.sendStatus(HttpStatusCode.Ok)
  }),
)

adminRouter.get(
  '/jamsurl',
  asyncHandler(async (req, res) => {
    const url = adminAccount.getJamsServerUrl()
    if (url === undefined) {
      res.status(HttpStatusCode.NoContent).send('JAMS server URL is not set')
      return
    }
    res.send(url)
  }),
)

const getSizeOnDisk = async (accountId: string) => {
  const pathToAccount = os.homedir() + '/.local/share/jami/' + accountId
  const files = await readdir(pathToAccount)
  const stats = files.map((file) => stat(path.join(pathToAccount, file)))
  return (await Promise.all(stats)).reduce((accumulator, { size }) => accumulator + size, 0)
}

adminRouter.get(
  '/accounts',
  asyncHandler(async (req, res) => {
    const allAccounts = accounts.getAll()
    const localAccounts = allAccounts.local
    const jamsAccounts = allAccounts.jams
    const accountsList: AccountOverview[] = []

    for (const [username, account] of Object.entries(jamsAccounts)) {
      const accountUri = jamid.getAccountDetails(account.accountId)['Account.username']
      if (accountUri) {
        accountsList.push({
          username,
          accountUri,
          auth: 'jams',
          storage: await getSizeOnDisk(account.accountId),
        })
      }
    }
    for (const [username] of Object.entries(localAccounts)) {
      const accountId = jamid.getAccountIdFromUsername(username)
      if (accountId) {
        const accountUri = jamid.getAccountDetails(accountId)['Account.username']
        if (accountUri) {
          accountsList.push({
            username,
            accountUri,
            auth: 'local',
            storage: await getSizeOnDisk(accountId),
          })
        }
      }
    }
    res.send(accountsList)
  }),
)

adminRouter.delete(
  '/accounts',
  asyncHandler(async (req, res) => {
    const users = req.body
    for (const user of users) {
      if (user.auth === 'local') {
        const accountId = jamid.getAccountIdFromUsername(user.username)
        if (accountId) {
          jamid.removeAccount(accountId)
        }
      } else if (user.auth === 'jams') {
        const account = accounts.get(user.username, user.auth)
        if (typeof account === 'object') {
          jamid.removeAccount(account.accountId)
        }
      }
      accounts.remove(user.username, user.auth)
    }
    res.sendStatus(HttpStatusCode.Ok)
  }),
)
