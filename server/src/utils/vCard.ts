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
import fs from 'fs/promises'
import os from 'os'
import { parseVCards } from 'vcard4-ts'

export async function getVCard(accountId: string, contactUri: string) {
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

export async function getDisplayName(accountId: string, contactUri: string) {
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

export async function getAvatar(accountId: string, contactUri: string) {
  const cacheFolder = os.homedir() + '/.local/share/jami/' + accountId + '/cache'
  const profileFolder = cacheFolder + '/profile'
  const imgName = btoa(contactUri)
  const imgPath = profileFolder + '/' + imgName + '.png'
  await fs.mkdir(cacheFolder, { recursive: true })
  await fs.mkdir(profileFolder, { recursive: true })
  try {
    await fs.access(imgPath)
    return imgPath
  } catch (e) {
    const data = await getVCard(accountId, contactUri)
    if (data?.name) {
      await fs.writeFile(profileFolder + '/' + imgName + '.txt', data.name)
    }
    if (data?.photo) {
      const base64Data = data.photo.replace(/^data:image\/png;base64,/, '')
      await fs.writeFile(imgPath, base64Data, 'base64')
      return imgPath
    }
    return undefined
  }
}
