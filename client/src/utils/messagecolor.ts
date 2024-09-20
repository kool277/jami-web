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
import MD5 from 'crypto-js/md5'

// do not modify the order of the colors
export const colors = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFC107',
  '#FF5722',
  '#795548',
  '#9E9E9E',
  '#607D8B',
]

// colors of bubble and text inside the bubble does not
// change based dark mode or light mode
const darkColorsText = ['#CDDC39']
const darkColorsTime = ['#9E9E9E', '#009688']
const lightColorsTime = ['#f44336', '#2196f3', '#00BCD4', '#4CAF50', '#FF5722', '#607D8B']

export function getTextColor(color: string): string {
  if (darkColorsText.includes(color)) {
    return '#4C4C4C'
  }
  return '#FFFFFF'
}

export function getSentTimeColor(color: string): string {
  if (lightColorsTime.includes(color)) {
    return '#d8d8d8'
  }
  if (darkColorsTime.includes(color)) {
    return '#6C6C6C'
  }
  return '#A6948B'
}

export function getColor(canonicalUri: string): string {
  if (canonicalUri === '') {
    return '#9E9E9E'
  }
  const hash: string = MD5(canonicalUri).toString()
  if (hash === '') {
    return '#9E9E9E'
  }
  const colorIndex = parseInt(hash.charAt(0) + '', 16)
  return colors[colorIndex % colors.length]
}
