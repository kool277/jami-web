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
import fs from 'fs'

export async function getAvailableLanguages() {
  try {
    while (!fs.existsSync('available_languages.json')) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const data = fs.readFileSync('available_languages.json')
    const content = JSON.parse(data.toString())

    const languages = []

    // add english as default language
    languages.push({
      tag: 'en',
      fullName: 'English',
    })

    for (const language of content.data) {
      languages.push({
        tag: language.attributes.code,
        fullName: language.attributes.name,
      })
    }

    return languages
  } catch (error) {
    console.error('Error reading available languages:', error)
    throw error
  }
}
