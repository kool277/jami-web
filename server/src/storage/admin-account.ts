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
import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'

import { IAdminAccount, IAdminConfigState } from 'jami-web-common'
import { Service } from 'typedi'

@Service()
export class AdminAccount {
  private readonly filename = 'admin.json'
  private adminAccount: IAdminAccount

  constructor() {
    let buffer: Buffer

    //1. when admin.json exists, assign what is in it to the adminAccount variable
    //2. when admin.json exists but there is no config (or anything that is required before accessing the admin panel), initialize it with the default settings and save everything to the admin.json
    //3. when admin.json does not exist, an empty object buffer is created and assgined to the adminAccount, and initialize it with the default configs.
    try {
      buffer = readFileSync(this.filename)
      this.adminAccount = JSON.parse(buffer.toString())
      if (this.adminAccount.config === undefined) {
        this.init()
        this.save()
      }
    } catch (e) {
      buffer = Buffer.from('{}')
      this.adminAccount = JSON.parse(buffer.toString())
      this.init()
      this.save()
    }
  }

  init() {
    this.adminAccount.config = {
      localAuthEnabled: true,
      jamsAuthEnabled: true,
      guestAccessEnabled: false,
      openIdAuthEnabled: false,
    }
  }

  getPasswordHash(): string | undefined {
    return this.adminAccount.admin
  }

  setPasswordHash(hashedPassword: string): void {
    this.adminAccount.admin = hashedPassword
  }

  getConfig(): IAdminConfigState {
    return this.adminAccount.config
  }

  updateConfig(config: Partial<IAdminConfigState>) {
    this.adminAccount.config = {
      ...this.adminAccount.config,
      ...config,
    }
  }

  async save(): Promise<void> {
    await writeFile(this.filename, JSON.stringify(this.adminAccount, null, 2) + '\n')
  }
}
