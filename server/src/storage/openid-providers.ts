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

import { IOpenIdProviders } from 'jami-web-common'
import { Container, Service } from 'typedi'

import { AdminAccount } from './admin-account.js'

const adminConfig = Container.get(AdminAccount)

@Service()
export class OpenIdProviders {
  private readonly filename = 'openid-providers.json'
  private providers: Map<string, IOpenIdProviders>
  // set the baseApiUrl to the value of the environment variable API_BASE_URL or 'http://localhost:5000'
  private baseApiUrl: string = process.env.API_BASE_URL || 'http://localhost:5000/api'
  private readonly defaultScope = 'openid%20email%20profile'

  constructor() {
    let buffer: Buffer

    try {
      buffer = readFileSync(this.filename)
      this.providers = new Map(Object.entries(JSON.parse(buffer.toString())))
      if (this.providers === undefined) {
        this.init()
        this.save()
      }
    } catch (e) {
      buffer = Buffer.from('{}')
      this.providers = new Map(Object.entries(JSON.parse(buffer.toString())))
      this.init()
      this.save()
    }
  }

  init(): void {
    this.providers = new Map()
    // init supported providers

    this.providers.set('google', {
      tokenUri: 'https://oauth2.googleapis.com/token',
      infoUri: 'https://www.googleapis.com/oauth2/v3/userinfo',
      authUri: 'https://accounts.google.com/o/oauth2/v2/auth',
      displayName: 'Google',
      documentation: 'https://developers.google.com/identity/protocols/oauth2',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
      colorTheme: '#d9d9d9',
    })

    this.providers.set('github', {
      tokenUri: 'https://github.com/login/oauth/access_token',
      infoUri: 'https://api.github.com/user',
      authUri: 'https://github.com/login/oauth/authorize',
      displayName: 'GitHub',
      documentation: 'https://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps/',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/GitHub_Invertocat_Logo.svg',
      colorTheme: '#d9d9d9',
    })

    this.providers.set('sfl-gitlab', {
      tokenUri: 'https://git.jami.net/oauth/token',
      infoUri: 'https://git.jami.net/oauth/userinfo',
      authUri: 'https://git.jami.net/oauth/authorize',
      displayName: 'SFL GitLab',
      documentation: 'https://docs.gitlab.com/ee/api/oauth2.html',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/3/35/GitLab_icon.svg',
      colorTheme: '#d9d9d9',
    })

    this.providers.set('discord', {
      tokenUri: 'https://discord.com/api/oauth2/token',
      infoUri: 'https://discord.com/api/users/@me',
      authUri: 'https://discord.com/api/oauth2/authorize',
      displayName: 'Discord',
      documentation: 'https://discord.com/developers/docs/topics/oauth2',
      scope: 'identify+email',
      icon: 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg',
      colorTheme: '#d9d9d9',
    })

    this.providers.set('linkedin', {
      tokenUri: 'https://www.linkedin.com/oauth/v2/accessToken',
      infoUri: 'https://api.linkedin.com/v2/userinfo',
      authUri: 'https://www.linkedin.com/oauth/v2/authorization',
      displayName: 'LinkedIn',
      documentation: 'https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg',
      colorTheme: '#d9d9d9',
    })
  }

  getProviders() {
    return this.providers
  }

  getOpenIdProvidersNames() {
    return Array.from(this.providers.keys())
  }

  getOpenIdConfig(provider: string) {
    return this.providers.get(provider)
  }

  setOpenIdProvider(provider: string, config: IOpenIdProviders) {
    this.providers.set(provider, config)
  }

  getRedirectUri(provider: string) {
    const config = this.providers.get(provider)
    if (!config) {
      return undefined
    }
    const uri = this.baseApiUrl + `/auth/oauth/${provider}/callback`
    return uri
  }

  getDisplayName(provider: string) {
    const config = this.providers.get(provider)
    if (!config) {
      return undefined
    }
    return config.displayName
  }

  getColorTheme(provider: string) {
    const config = this.providers.get(provider)
    if (!config) {
      return undefined
    }
    return config.colorTheme
  }

  getIcon(provider: string) {
    const config = this.providers.get(provider)
    if (!config) {
      return undefined
    }
    return config.icon
  }

  getAllAuthorizeUrls() {
    const urls = new Map<string, string>()

    for (const [provider, config] of this.providers) {
      const admin = adminConfig.getOpenIdProvider(provider)
      const clientId = admin?.clientId
      const isActive = admin?.isActive
      if (!isActive) {
        continue
      }
      if (!clientId) {
        continue
      }

      const redirectUri = this.getRedirectUri(provider)

      const scope = config.scope ? config.scope : this.defaultScope

      const url =
        config.authUri +
        '?client_id=' +
        clientId +
        '&redirect_uri=' +
        redirectUri +
        '&response_type=code' +
        '&scope=' +
        scope
      urls.set(provider, url)
    }
    return urls
  }

  async save(): Promise<void> {
    await writeFile(this.filename, JSON.stringify(Object.fromEntries(this.providers), null, 2) + '\n')
  }
}
