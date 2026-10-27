/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
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
import { describe, expect, it } from 'vitest'

import { inTranslationScript, languageTag, matchBrowserLanguage } from './browserLanguage.js'

// Translation codes as Transifex names them.
const available = new Set(['en', 'ru', 'ru_RU', 'sr', 'sr@Cyrl', 'uz', 'uz-Latn-2026', 'uz@Cyrl', 'zh-Hans'])

describe('matchBrowserLanguage', () => {
  it('keeps a language with its region when that translation exists', () => {
    expect(matchBrowserLanguage('ru-RU', available)).toBe('ru_RU')
  })

  it('falls back to the language without its region', () => {
    expect(matchBrowserLanguage('uz-UZ', available)).toBe('uz')
    expect(matchBrowserLanguage('ru-BY', available)).toBe('ru')
  })

  it('chooses the translation in the script the browser asks for', () => {
    expect(matchBrowserLanguage('uz-Cyrl-UZ', available)).toBe('uz@Cyrl')
    expect(matchBrowserLanguage('uz-Cyrl', available)).toBe('uz@Cyrl')
    expect(matchBrowserLanguage('sr-Cyrl-RS', available)).toBe('sr@Cyrl')
    expect(matchBrowserLanguage('uz-Latn-UZ', available)).toBe('uz')
  })

  it('accepts a code that names a translation as it is', () => {
    expect(matchBrowserLanguage('zh-Hans', available)).toBe('zh-Hans')
    expect(matchBrowserLanguage('uz-Latn-2026', available)).toBe('uz-Latn-2026')
  })

  it('finds nothing for a language without a translation', () => {
    expect(matchBrowserLanguage('kk-KZ', available)).toBeUndefined()
  })
})

describe('languageTag', () => {
  it('names a translation with its region as a locale', () => {
    expect(languageTag('ru_RU')).toBe('ru-RU')
    expect(languageTag('es_419')).toBe('es-419')
  })

  it('names a translation in a script as a locale in that script', () => {
    expect(languageTag('uz@Cyrl')).toBe('uz-Cyrl')
    expect(languageTag('sr@Cyrl')).toBe('sr-Cyrl')
  })

  it('keeps a code that already is a locale', () => {
    expect(languageTag('uz')).toBe('uz')
    expect(languageTag('zh-Hans')).toBe('zh-Hans')
    expect(languageTag('uz-Latn-2026')).toBe('uz-Latn-2026')
  })

  it('falls back to the language when the rest is not a locale', () => {
    expect(languageTag('zh_CN.GB2312')).toBe('zh')
  })
})

describe('inTranslationScript', () => {
  it('writes Uzbek dates in the Latin alphabet of 2026', () => {
    expect(inTranslationScript('chorshanba', 'uz-Latn-2026')).toBe('çorşanba')
    expect(inTranslationScript('Kecha', 'uz-Latn-2026')).toBe('Keça')
    expect(inTranslationScript('DUSHANBA', 'uz-Latn-2026')).toBe('DUŞANBA')
    expect(inTranslationScript('Shanba, o‘tgan hafta', 'uz-Latn-2026')).toBe('Şanba, ötgan hafta')
    expect(inTranslationScript('Gʻalaba', 'uz-Latn-2026')).toBe('Ğalaba')
  })

  it('leaves the other translations as they are', () => {
    expect(inTranslationScript('chorshanba', 'uz')).toBe('chorshanba')
    expect(inTranslationScript('Thursday', 'en')).toBe('Thursday')
  })
})
