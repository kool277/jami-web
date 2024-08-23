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
import { AccessToken, AdminCredentials, HttpStatusCode } from 'jami-web-common'
import { Container } from 'typedi'

import { adminAuthenticationMiddleware } from '../middleware/auth.js'
import { checkAdminSetup } from '../middleware/setup.js'
import { AdminAccount } from '../storage/admin-account.js'
import { isConfigValid } from '../utils/admin.js'
import { signJwt } from '../utils/jwt.js'
const adminAccount = Container.get(AdminAccount)

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
