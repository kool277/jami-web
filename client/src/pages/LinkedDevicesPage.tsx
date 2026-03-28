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

import { Box, Grid } from '@mui/material'

import LinkedDevices from '../components/AccountSettings/LinkedDevices'

export default function LinkedDevicesPage() {
  const styles = {
    textOverflow: 'ellipsis',
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', maxWidth: '100%' }}>
      <Grid container size={{ xs: 10, sm: 12 }} sx={styles}>
        <LinkedDevices />
      </Grid>
    </Box>
  )
}
