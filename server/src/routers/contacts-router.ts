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
import fs from 'fs/promises'
import { HttpStatusCode } from 'jami-web-common'
import os from 'os'
import { Container } from 'typedi'
import { parseVCards } from 'vcard4-ts'

import { Jamid } from '../jamid/jamid.js'
import { authenticateToken } from '../middleware/auth.js'
const jamid = Container.get(Jamid)
export const contactsRouter = Router()

contactsRouter.use(authenticateToken)

async function getVCard(accountId: string, contactUri: string) {
  const fileName = btoa(contactUri) + '.vcf'
  const path = os.homedir() + '/.local/share/jami/' + accountId + '/profiles/' + fileName
  const data: { name: string; photo?: string } = { name: '', photo: undefined }
  try {
    const file = await fs.readFile(path)
    const card = parseVCards(file.toString())
    if (card.vCards) {
      data.name = card.vCards[0].FN[0].value
      if (card.vCards[0].PHOTO) {
        data.photo = card.vCards[0].PHOTO[0].value
      }
    }
    return data
  } catch (e) {
    return undefined
  }
}

async function getDisplayName(accountId: string, contactUri: string) {
  // verify if the file exists in the cache
  const folder = os.homedir() + '/.local/share/jami/' + accountId + '/cache/profile'
  const fileName = btoa(contactUri) + '.txt'
  const path = folder + '/' + fileName
  try {
    const file = await fs.readFile(path)
    return file.toString()
  } catch (e) {
    return undefined
  }
}

contactsRouter.get('/', async (_req, res) => {
  const contacts = jamid.getContacts(res.locals.accountId)
  for (const contact of contacts) {
    const contactUsername = await jamid.lookupAddress(contact.id, res.locals.accountId)
    contact.displayName = await getDisplayName(res.locals.accountId, contact.id)
    if (contactUsername.address === contact.id) {
      contact.username = contactUsername.username
    }
  }
  res.send(contacts)
})

contactsRouter.get('/:contactId', async (req, res) => {
  const contactDetails = jamid.getContactDetails(res.locals.accountId, req.params.contactId)
  const contactUsername = await jamid.lookupAddress(contactDetails.id, res.locals.accountId)
  if (contactUsername.address === contactDetails.id) {
    contactDetails.username = contactUsername.username
  }
  contactDetails.displayName = await getDisplayName(res.locals.accountId, contactDetails.id)
  if (Object.keys(contactDetails).length === 0) {
    res.status(HttpStatusCode.NotFound).send('No such contact found')
    return
  }
  res.send(contactDetails)
})

contactsRouter.put('/:contactId', (req, res) => {
  const accountId = res.locals.accountId
  const contactId = req.params.contactId

  jamid.addContact(accountId, contactId)
  // We need to manually send a conversation request
  jamid.sendTrustRequest(accountId, contactId)

  const contactDetails = jamid.getContactDetails(accountId, contactId)
  if (Object.keys(contactDetails).length === 0) {
    res.status(HttpStatusCode.NotFound).send('No such contact found')
    return
  }

  res.send(contactDetails)
})

contactsRouter.delete('/:contactId', (req, res) => {
  jamid.removeContact(res.locals.accountId, req.params.contactId)
  res.sendStatus(HttpStatusCode.NoContent)
})

contactsRouter.post('/:contactId/block', (req, res) => {
  jamid.blockContact(res.locals.accountId, req.params.contactId)
  res.sendStatus(HttpStatusCode.NoContent)
})

contactsRouter.get('/:contactUri/profile/picture', async (req, res) => {
  const cacheFolder = os.homedir() + '/.local/share/jami/' + res.locals.accountId + '/cache'
  const profileFolder = cacheFolder + '/profile'
  //create directory if not exists
  try {
    await fs.access(cacheFolder)
  } catch (e) {
    await fs.mkdir(cacheFolder)
  }
  try {
    await fs.access(profileFolder)
  } catch (e) {
    await fs.mkdir(profileFolder)
  }

  const imgName = btoa(req.params.contactUri)

  for (const file of await fs.readdir(profileFolder)) {
    if (file.includes(imgName)) {
      res.sendFile(profileFolder + '/' + file)
      return
    }
  }
  const data = getVCard(res.locals.accountId, req.params.contactUri)
  // saves picture to file
  data.then(async (data) => {
    console.log(data?.name)
    if (data?.name) {
      await fs.writeFile(profileFolder + '/' + imgName + '.txt', data.name)
    }
    if (data?.photo) {
      const base64Data = data.photo.replace(/^data:image\/png;base64,/, '')
      await fs.writeFile(profileFolder + '/' + imgName + '.png', base64Data, 'base64')
      res.sendFile(profileFolder + '/' + imgName + '.png')
      return
    }
    res.sendStatus(HttpStatusCode.NotFound)
  })
})
