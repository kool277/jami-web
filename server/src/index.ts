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
import 'reflect-metadata'

import { createServer } from 'node:http'
import { resolve } from 'node:path'

import log from 'loglevel'
import { Container } from 'typedi'

import { App } from './app.js'
import { Jamid } from './jamid/jamid.js'
import { SigningKeys } from './storage/signing-keys.js'
import { defaultEnvPath, loadEnv } from './utils/env.js'
import { WebSocketServer } from './websocket/websocket-server.js'

loadEnv()

const KNOWN_NODE_ENVS = ['development', 'production', 'test']
const nodeEnv = process.env.NODE_ENV || 'production'
if (!KNOWN_NODE_ENVS.includes(nodeEnv)) {
  console.warn(
    `Warning: unknown NODE_ENV "${nodeEnv}". Expected one of: ${KNOWN_NODE_ENVS.join(', ')}. ` +
      `Defaulting to production behaviour.`,
  )
}

const isDev = nodeEnv === 'development'

log.setLevel(isDev ? 'trace' : 'error')

const defaultPort = isDev ? 5002 : 8080
const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : defaultPort
const host = process.env.HOST

if (Number.isNaN(port)) {
  console.error(`Invalid PORT value: "${process.env.PORT}". PORT must be a number (e.g. PORT=8080).`)
  process.exit(1)
}

await Container.get(SigningKeys).build()
const jamid = Container.get(Jamid)
const app = Container.get(App)
const webSocketServer = Container.get(WebSocketServer)

const server = createServer()

server.on('request', app.app)
server.on('upgrade', webSocketServer.upgrade.bind(webSocketServer))

server.listen(port, host)
server.on('error', onError)
server.on('listening', onListening)

process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)

function onError(error: NodeJS.ErrnoException) {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`

  switch (error.code) {
    case 'EACCES':
      console.error(
        `${bind} requires elevated privileges. ` +
          `Ports below 1024 are privileged; choose a port >= 1024 (e.g. PORT=8080) ` +
          `or run behind a reverse proxy.`,
      )
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(
        `${bind} is already in use. ` +
          `Stop the process using it, or set a different port with PORT=<port>. ` +
          `Run "jami-web doctor" to check port availability.`,
      )
      process.exit(1)
      break
    default:
      throw error
  }
}

function onListening() {
  const address = server.address()
  const bind = typeof address === 'string' ? `pipe ${address}` : `${address?.address}:${address?.port}`
  const envFile = process.env.JAMI_WEB_ENV_FILE ? resolve(process.env.JAMI_WEB_ENV_FILE) : defaultEnvPath
  console.log('Jami Web server started')
  console.log(`  Environment: ${nodeEnv}`)
  console.log(`  Env file:    ${envFile}`)
  console.log(`  Listening:   ${bind}`)
  log.debug('Listening on ' + bind)
}

function shutdown(signal: NodeJS.Signals) {
  log.debug(`${signal} received: shutting down server`)
  jamid.stop()
  server.close(() => {
    log.debug('Server shut down')
    // Needed in order to actually exit the process as its shutdown is blocked by something else
    process.exit()
  })
}
