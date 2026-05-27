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

import { useState } from 'react'

import { SettingSwitch } from '../Settings.js'

const SettingTips = () => {
  const [isDisabled, setIsDisabled] = useState<boolean>(localStorage.getItem('disable-tips') === 'true')

  const handleTipState = () => {
    if (isDisabled) {
      localStorage.removeItem('disable-tips')
      setIsDisabled(false)
      return
    }
    localStorage.setItem('disable-tips', 'true')
    setIsDisabled(true)
  }

  return <SettingSwitch label="Disable tips" onChange={handleTipState} checked={isDisabled} />
}

export default SettingTips
