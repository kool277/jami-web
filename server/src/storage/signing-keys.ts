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

import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import { generateKeyPair, importPKCS8, importSPKI, KeyLike } from 'jose'
import { Service } from 'typedi'

import { isElectronMode } from '../utils/electron.js'
import { defaultEnvPath } from '../utils/env.js'
import { formatSigningKeyEnv, generateSigningKeyPairPem } from '../utils/signing-key-pem.js'

@Service()
export class SigningKeys {
  privateKey!: KeyLike
  publicKey!: KeyLike

  async build() {
    let privatekey = process.env.PRIVATE_KEY
    let publicKey = process.env.PUBLIC_KEY

    if (privatekey === undefined || publicKey === undefined) {
      if (isElectronMode) {
        // Auto-generate keys in Electron mode
        const keyPair = await generateKeyPair('EdDSA', { crv: 'Ed25519' })
        this.privateKey = keyPair.privateKey
        this.publicKey = keyPair.publicKey
        return this
      }
      if (privatekey === undefined && publicKey === undefined) {
        const keyPair = generateSigningKeyPairPem()
        mkdirSync(dirname(defaultEnvPath), { recursive: true })
        appendFileSync(defaultEnvPath, formatSigningKeyEnv(keyPair))
        privatekey = keyPair.privateKey
        publicKey = keyPair.publicKey
      } else {
        throw new Error('Missing private or public key environment variables. Try running "jami-web genkeys --force"')
      }
    }

    this.privateKey = await importPKCS8(privatekey, 'EdDSA')
    this.publicKey = await importSPKI(publicKey, 'EdDSA')

    return this
  }
}
