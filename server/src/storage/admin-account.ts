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
  private defaultUploadPath: string = 'uploads/'

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
      jamsAuthEnabled: !!this.getJamsServerUrl(),
      guestAccessEnabled: false,
      openIdAuthEnabled: false,
      uploadPath: this.defaultUploadPath,
    }
  }

  getUploadPath(): string {
    if (!('uploadPath' in this.adminAccount.config) || this.adminAccount.config.uploadPath === undefined) {
      this.adminAccount.config.uploadPath = this.defaultUploadPath
      this.save()
    }
    return this.adminAccount.config.uploadPath
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

  getNameServerAddress() {
    const name = this.adminAccount.nameserver
    if (typeof name === 'string') {
      return name
    }
    // returns a default value if the name is not set
    return ''
  }

  resetNameServerAdress() {
    //here the goal is to remove completely the name server
    //address and the key from the configuration file
    delete this.adminAccount.nameserver
  }

  setNameServerAdress(value: string) {
    this.adminAccount.nameserver = value
  }

  getJamsServerUrl() {
    const url = this.adminAccount.jamsUrl
    return url
  }

  setJamsServerUrl(value: string): void {
    this.adminAccount.jamsUrl = value
  }

  resetJamsServerUrl(): void {
    delete this.adminAccount.jamsUrl
  }

  async save(): Promise<void> {
    await writeFile(this.filename, JSON.stringify(this.adminAccount, null, 2) + '\n')
  }
}
