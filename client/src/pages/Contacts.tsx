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
import { Box } from '@mui/material'

import ContactList from '../components/ContactList'
import EditSwarmDetails from '../components/EditSwamDetails'
import Footer from '../components/Footer'

export default function Contacts() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
      <Box sx={{ backgroundColor: '#F2F2F2', width: '22vw', height: '100vh' }}>
        <Footer />
        <ContactList />
      </Box>
      <Box sx={{ width: '100%', height: '100%' }}>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            textAlign: 'center',
            marginTop: '20vh',
          }}
        >
          <EditSwarmDetails />
        </Box>
      </Box>
    </Box>
  )
}
