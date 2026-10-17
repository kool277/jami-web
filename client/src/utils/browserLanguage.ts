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

/**
 * The translation for a browser language (BCP 47, as in `navigator.language`: `uz-Cyrl-UZ`), among
 * translations named as Transifex does (`uz`, `uz@Cyrl`, `ru_RU`): the language with its region,
 * then in its script, then alone.
 */
export function matchBrowserLanguage(browserLanguage: string, available: ReadonlySet<string>): string | undefined {
  const [language, ...subtags] = browserLanguage.split('-')
  const script = subtags.find((subtag) => /^[A-Za-z]{4}$/.test(subtag))
  const region = subtags.find((subtag) => /^([A-Za-z]{2}|\d{3})$/.test(subtag))
  const candidates = [
    browserLanguage,
    browserLanguage.replace('-', '_'),
    region && `${language}_${region.toUpperCase()}`,
    script && `${language}@${script[0].toUpperCase()}${script.slice(1).toLowerCase()}`,
    language,
  ]
  return candidates.find((candidate) => candidate && available.has(candidate)) || undefined
}
