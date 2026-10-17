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

import { matchBrowserLanguage } from './browserLanguage.js'

// Translation codes as Transifex names them.
const available = new Set(['en', 'ru', 'ru_RU', 'sr', 'sr@Cyrl', 'uz', 'uz@Cyrl', 'zh-Hans'])

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
  })

  it('finds nothing for a language without a translation', () => {
    expect(matchBrowserLanguage('kk-KZ', available)).toBeUndefined()
  })
})
