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
import { NextFunction, Request, Response } from 'express'
import { HttpStatusCode } from 'jami-web-common'
import { Container } from 'typedi'

import { Accounts } from '../storage/accounts.js'
import { ApiTokenStore } from '../storage/api-tokens.js'
import { isElectronMode } from '../utils/electron.js'
import { verifyJwt } from '../utils/jwt.js'

const accounts = Container.get(Accounts)
const tokenStore = Container.get(ApiTokenStore)

const API_TOKEN_PREFIX = 'jm_sk_'

function createAuthenticationMiddleware(isAuthenticationRequired: boolean) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authorizationHeader = req.headers.authorization
    if (!authorizationHeader) {
      if (isAuthenticationRequired) {
        res.status(HttpStatusCode.Unauthorized).send('Missing Authorization header')
      } else {
        res.locals.accountId = undefined
        next()
      }
      return
    }

    const token = authorizationHeader.split(' ')[1]
    if (token === undefined) {
      res.status(HttpStatusCode.BadRequest).send('Missing access token')
      return
    }

    // API token authentication (prefixed with jm_sk_)
    if (token.startsWith(API_TOKEN_PREFIX)) {
      const result = tokenStore.validateToken(token)
      if (!result) {
        res.status(HttpStatusCode.Unauthorized).send('Invalid or expired API token')
        return
      }
      res.locals.accountId = result.accountId
      res.locals.tokenScopes = result.scopes
      next()
      return
    }

    // JWT authentication (default)
    try {
      const { payload } = await verifyJwt(token)
      const accountId = String(payload.accountId)
      // In Electron mode, the daemon is the source of truth — skip the accounts.json check
      if (!isElectronMode) {
        const isValid = accounts.isValidAccountId(accountId)
        if (!isValid) {
          res.status(HttpStatusCode.Unauthorized).send('Invalid account ID')
          return
        }
      }
      res.locals.accountId = accountId
      // si accId
      next()
    } catch (e) {
      res.status(HttpStatusCode.Unauthorized).send('Invalid access token')
    }
  }
}

export const authenticateToken = createAuthenticationMiddleware(true)

export const authenticateOptionalToken = createAuthenticationMiddleware(false)

export const adminAuthenticationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (isElectronMode) {
    next()
    return
  }

  const authorizationHeader = req.headers.authorization
  if (!authorizationHeader) {
    res.sendStatus(HttpStatusCode.Unauthorized)
    return
  }
  const token = authorizationHeader.split(' ')[1]
  if (token === undefined) {
    res.status(HttpStatusCode.Unauthorized).send('Missing JSON web token')
    return
  }

  try {
    const { payload } = await verifyJwt(token)
    //TODO: use a more secure way to only grant access to the real admin, using accountId might pose a risk since 'admin' could be a valid regular username
    if (payload.accountId === 'admin') {
      next()
    }
  } catch (e) {
    res.status(HttpStatusCode.Unauthorized).send('Invalid access token')
  }
}
