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
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { renderLaunchAgent, renderSystemdUnit } from './install.js'

describe('startup service installer', () => {
  it('renders a systemd user service with exact executable paths', () => {
    const unit = renderSystemdUnit('/opt/node/bin/node', '/opt/jami web/dist/cli.js')

    assert.match(unit, /^Description=Jami Web$/m)
    assert.match(unit, /^ExecStart="\/opt\/node\/bin\/node" "\/opt\/jami web\/dist\/cli\.js" start$/m)
    assert.match(unit, /^Environment=NODE_ENV=production$/m)
    assert.match(unit, /^WantedBy=default\.target$/m)
  })

  it('escapes systemd path metacharacters', () => {
    const unit = renderSystemdUnit('/opt/node%20/bin/node', '/opt/jami\\"web/cli.js')

    assert.match(unit, /ExecStart="\/opt\/node%%20\/bin\/node" "\/opt\/jami\\\\\\"web\/cli\.js" start/)
  })

  it('renders a launch agent with escaped executable paths', () => {
    const plist = renderLaunchAgent('/opt/node&tools/node', '/opt/jami<web>/cli.js')

    assert.match(plist, /<string>\/opt\/node&amp;tools\/node<\/string>/)
    assert.match(plist, /<string>\/opt\/jami&lt;web&gt;\/cli\.js<\/string>/)
    assert.match(plist, /<key>RunAtLoad<\/key>\s*<true\/>/)
    assert.match(plist, /<key>SuccessfulExit<\/key>\s*<false\/>/)
  })
})
