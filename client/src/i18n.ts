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
import i18n, { ResourceLanguage } from 'i18next'
import { initReactI18next } from 'react-i18next'

import { apiUrl } from './utils/constants'

interface LanguageInfo {
  readonly tag: LanguageTag
  readonly fullName: string
}

async function getAvailableLanguages(): Promise<string[]> {
  try {
    const response = await fetch(apiUrl + '/config/languages')
    const data = await response.json()
    console.log('Available languages:', data)
    return data
  } catch (error) {
    console.error('Error fetching available languages:', error)
    return []
  }
}

async function getTranslation(language: string): Promise<ResourceLanguage> {
  try {
    const response = await fetch(apiUrl + `/config/languages/${language}/`)
    const data = await response.json()
    console.log(`Translation for ${language}:`, data)
    return data
  } catch (error) {
    console.error(`Error fetching translation for ${language}:`, error)
    return {}
  }
}

const availableLanguages = await getAvailableLanguages()
export type LanguageTag = (typeof availableLanguages)[number]

const languagesInfosPromises = availableLanguages.map(async (item: any) => ({
  tag: item.tag,
  fullName: item.fullName,
}))

export const languagesInfos: readonly LanguageInfo[] = await Promise.all(languagesInfosPromises)

const lastLanguage = localStorage.getItem('language')
const defaultLanguage = lastLanguage ? lastLanguage : 'en'

const initialResources = await getTranslation(defaultLanguage)

await i18n.use(initReactI18next).init({
  debug: import.meta.env.DEV,
  lng: defaultLanguage,
  interpolation: {
    escapeValue: false,
  },
})

i18n.addResourceBundle(defaultLanguage, 'translation', initialResources)
i18n.changeLanguage(defaultLanguage)

export const loadLanguageAsync = async (language: string) => {
  localStorage.setItem('language', language)
  if (i18n.hasResourceBundle(language, 'translation')) {
    return
  }
  const translation = await getTranslation(language)
  i18n.addResourceBundle(language, 'translation', translation)
}

export default i18n
