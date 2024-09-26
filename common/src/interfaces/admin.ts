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

export interface IAdminConfigState {
  localAuthEnabled: boolean
  jamsAuthEnabled: boolean
  guestAccessEnabled: boolean
  openIdAuthEnabled: boolean
}

export interface IAdminAccount {
  admin: string
  config: IAdminConfigState
  nameserver?: string
  jamsUrl?: string
}

//For runtime type check
export const adminConfigValuePair = {
  localAuthEnabled: 'boolean',
  jamsAuthEnabled: 'boolean',
  guestAccessEnabled: 'boolean',
  openIdAuthEnabled: 'boolean',
}

export interface AccountOverview {
  username: string
  accountUri: string
  auth: string
  storage: number
}
