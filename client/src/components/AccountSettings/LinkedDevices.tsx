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

import GroupRounded from '@mui/icons-material/AddCircle'
import { Box } from '@mui/material'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import { useAuthContext } from '../../contexts/AuthProvider'

function LinkedDevices() {
  const { account } = useAuthContext()
  const { t } = useTranslation()
  const devices: string[][] = []
  const accountDevices = account.devices
  for (const i in accountDevices) devices.push([i, accountDevices[i]])
  //TODO: reduce number of renders
  console.log(devices)

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <Grid
        item
        xs={12}
        sm={6}
        aria-label="linked-device"
        sx={{
          padding: '3%',
        }}
      >
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              {t('settings_linked_devices')}
            </Typography>
            <Typography gutterBottom variant="h5" component="h2">
              {devices.map((device, i) => (
                <ListItem key={i}>
                  <GroupRounded />
                  <ListItemText id="switch-list-label-rendezvous" primary={device[1]} secondary={device[0]} />
                </ListItem>
              ))}
              {/* <ListItemTextsion> */}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Box>
  )
}

export default LinkedDevices
