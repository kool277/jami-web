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
import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import fs from 'fs'
import { DataTransferEventCode, HttpStatusCode } from 'jami-web-common'
import multer from 'multer'
import os from 'os'
import { Container } from 'typedi'

import { Jamid } from '../jamid/jamid.js'
import { authenticateToken } from '../middleware/auth.js'
import { AdminAccount } from '../storage/admin-account.js'
const config = Container.get(AdminAccount)

const multerPath = config.getUploadPath()
if (!fs.existsSync(multerPath)) {
  fs.mkdirSync(multerPath)
}

function parseName(name: string) {
  let fileName = name.replace('\\', '_')
  fileName = fileName.replace('/', '_')
  fileName = fileName.replace("'", '_')
  fileName = fileName.replace('"', '_')
  return fileName
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const accountId = req.res?.locals.accountId
    const userFilePath = multerPath + accountId + '/'
    if (!fs.existsSync(userFilePath)) {
      fs.mkdirSync(userFilePath)
    }
    cb(null, userFilePath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const extension = parseName(file.originalname.split('.').pop() || '')
    const filename = file.fieldname + '-' + uniqueSuffix + '.' + extension
    cb(null, filename)
  },
})

const upload = multer({ storage: storage })
const jamid = Container.get(Jamid)
export const dataTransferRouter = Router()

dataTransferRouter.use(authenticateToken)

dataTransferRouter.post(
  '/:conversationId',
  upload.array('file'),
  asyncHandler(async (req, res) => {
    const accountId = res.locals.accountId
    const conversationId = req.params.conversationId

    const replyTo = req.body.replyTo
    for (const file of req.files as Express.Multer.File[]) {
      // the file is temporarily stored in the server
      // for now the files are stored in the uploads folder (automatically created)
      // we don t know when the file will be downloaded from the client
      // when it happens the file will be stored in the uploads folder and
      // in /home/<username>/.local/share/jami/:accountId/conversation_data/:conversationId/:fileId
      // which can be concerning if the file is too big
      // the service isnt a cloud service so we need to remove files after a certain time
      const updatedFileName = parseName(file.originalname)
      const path = multerPath + accountId + '/' + file.filename
      jamid.sendFile(accountId, conversationId, path, updatedFileName, replyTo)
    }
    res.status(HttpStatusCode.Ok).send()
  }),
)

dataTransferRouter.get('/:conversationId/:interactionId/:fileId', async (req, res) => {
  const accountId = res.locals.accountId
  const conversationId = req.params.conversationId
  const interactionId = req.params.interactionId
  const fileId = req.params.fileId
  const downloadPathOnServer = ''
  const acceptedAudioTypes = ['ogg', 'wav', 'mpeg', 'mp4', 'aac', 'flac']
  const acceptedImageTypes = ['apng', 'avif', 'jpg', 'JPG', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff']

  // file is stored in /home/<username>/.local/share/jami/:accountId/conversation_data/:conversationId/:fileId
  const path = os.homedir() + '/.local/share/jami/' + accountId + '/conversation_data/' + conversationId + '/' + fileId

  if (fs.existsSync(path)) {
    const extension = path.split('.').pop() || ''

    if (acceptedAudioTypes.includes(extension)) {
      res.setHeader('Content-Type', 'audio/' + extension)
    } else if (acceptedImageTypes.includes(extension)) {
      res.setHeader('Content-Type', 'image/' + extension)
    }

    res.sendFile(path, (err) => {
      if (err) {
        console.error('Error sending file:', err)
        res.status(HttpStatusCode.InternalServerError).send('Error sending file')
      }
    })
    return
  }

  // if the file is not found in the local storage, we download it from the daemon
  const status = jamid.downloadFile(accountId, conversationId, interactionId, fileId, downloadPathOnServer)

  if (status === 0) {
    res.status(HttpStatusCode.NotFound).send('File not found')
    return
  }

  let code = await jamid.waitForDataTransferEvent(accountId, conversationId, interactionId, fileId)

  const errors = [
    DataTransferEventCode.invalid,
    DataTransferEventCode.unsupported,
    DataTransferEventCode.invalid_pathname,
    DataTransferEventCode.unjoinable_peer,
    DataTransferEventCode.timeout_expired,
    DataTransferEventCode.closed_by_host,
    DataTransferEventCode.closed_by_peer,
  ]

  if (errors.includes(code.eventCode)) {
    console.error('Error code:', code)
    res.status(HttpStatusCode.NotFound).send('Error ' + DataTransferEventCode[code.eventCode])
    return
  }

  while (code.eventCode !== DataTransferEventCode.finished) {
    code = await jamid.waitForDataTransferEvent(accountId, conversationId, interactionId, fileId)
    if (errors.includes(code.eventCode)) {
      console.error('Error code:', code)
      res.status(HttpStatusCode.NotFound).send('Error ' + DataTransferEventCode[code.eventCode])
      return
    }
  }

  const extension = path.split('.').pop() || ''
  if (acceptedAudioTypes.includes(extension)) {
    res.setHeader('Content-Type', 'audio/' + extension)
  } else if (acceptedImageTypes.includes(extension)) {
    res.setHeader('Content-Type', 'image/' + extension)
  }
  res.sendFile(path, (err) => {
    if (err) {
      console.error('Error sending file:', err)
      res.status(HttpStatusCode.InternalServerError).send('Error sending file')
    }
  })
})
