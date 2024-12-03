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
import cors from 'cors'
import * as dotenv from 'dotenv'
import express, { json, NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import { HttpStatusCode } from 'jami-web-common'
import log from 'loglevel'
import path from 'path'
import { Service } from 'typedi'
import { fileURLToPath } from 'url'

import { accountRouter } from './routers/account-router.js'
import { adminRouter } from './routers/admin-router.js'
import { authRouter } from './routers/auth-router.js'
import { callRouter } from './routers/call-router.js'
import { contactsRouter } from './routers/contacts-router.js'
import { conversationRequestRouter } from './routers/conversation-request-router.js'
import { conversationRouter } from './routers/conversation-router.js'
import { dataTransferRouter } from './routers/data-transfer.js'
import { defaultModeratorsRouter } from './routers/default-moderators-router.js'
import { linkPreviewRouter } from './routers/link-preview-router.js'
import { nameserverRouter } from './routers/nameserver-router.js'
import { bindChatCallbacks } from './websocket/chat-handler.js'
import { bindReactionAddedCallBack } from './websocket/chat-reactionadded-handler.js'
import { bindReactionRemovedCallBack } from './websocket/chat-reactionremoved-handler.js'
import { bindLoadMoreMessagesCallBack } from './websocket/load-more-messages-handler.js'
import { bindMessageStatusChangeCallbacks } from './websocket/message-status-handler.js'
import { bindWebRtcCallbacks } from './websocket/webrtc-handler.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isDevMode = process.env.NODE_ENV === 'development' ? true : false

@Service()
export class App {
  app = express()

  constructor() {
    // Setup middleware
    this.app.use(helmet())
    this.app.use(cors())
    this.app.use(json())

    const apiRouter = express.Router()
    this.app.use('/api', apiRouter)

    // Enforce admin setup
    apiRouter.use('/admin', adminRouter)

    // Setup routing
    apiRouter.use('/auth', authRouter)
    apiRouter.use('/account', accountRouter)
    apiRouter.use('/contacts', contactsRouter)
    apiRouter.use('/default-moderators', defaultModeratorsRouter)
    apiRouter.use('/conversations', conversationRouter)
    apiRouter.use('/conversation-requests', conversationRequestRouter)
    apiRouter.use('/calls', callRouter)
    apiRouter.use('/link-preview', linkPreviewRouter)
    apiRouter.use('/ns', nameserverRouter)
    apiRouter.use('/data', dataTransferRouter)

    if (!isDevMode) {
      // Serve static files from the client
      this.app.use(express.static(path.join(__dirname, '../../client/dist')))

      this.app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../client/dist', 'index.html'))
      })
    }

    // Setup WebSocket callbacks
    bindChatCallbacks()
    bindWebRtcCallbacks()
    bindMessageStatusChangeCallbacks()
    bindReactionAddedCallBack()
    bindReactionRemovedCallBack()
    bindLoadMoreMessagesCallBack()

    // Setup 404 error handling
    this.app.use((_req, res) => {
      res.sendStatus(HttpStatusCode.NotFound)
    })

    // Setup internal error handling
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      log.error(err)
      res.status(HttpStatusCode.InternalServerError).send(err.message)
    })
  }
}
