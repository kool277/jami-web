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

import DevicesIcon from '@mui/icons-material/Devices'
import { Box } from '@mui/material'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuthContext } from '../../contexts/AuthProvider'
import { useRemoveLinkedDevice } from '../../services/accountQueries'
import EllipsisMiddle from '../EllipsisMiddle'
import { TrashBinIcon } from '../SvgIcon'

function LinkedDevices() {
  const { account } = useAuthContext()
  const { t } = useTranslation()
  const removeLinkedDeviceMutation = useRemoveLinkedDevice()

  const devices = useMemo(() => {
    const deviceList: string[][] = []
    const accountDevices = account.devices

    for (const deviceId in accountDevices) {
      if (deviceId === account.volatileDetails['Account.deviceID']) continue
      deviceList.push([deviceId, accountDevices[deviceId]])
    }

    return deviceList
  }, [account.devices, account.volatileDetails])

  function removeDevice(deviceId: string) {
    removeLinkedDeviceMutation.mutate({ deviceId })
  }

  return (
    <Grid item xs={12} sm={12} aria-label="linked-device">
      <Card>
        <CardContent sx={{ width: '100%' }}>
          <Typography sx={{}} color="textSecondary" gutterBottom>
            {t('settings_linked_devices')}
          </Typography>
          <Typography gutterBottom variant="h5" component="h2">
            <ListItem>
              <DevicesIcon sx={{ padding: '4px', margin: '4px', marginRight: '16px', height: '40px', width: '40px' }} />
              <ListItemText
                id="switch-list-label-rendezvous"
                primary={
                  <>
                    {account.details['Account.deviceName']}
                    <span style={{ fontSize: 'small', fontWeight: 'bolder', marginLeft: '3%' }}>
                      {t('current_device')}
                    </span>
                  </>
                }
                secondary={
                  <Typography noWrap sx={{ textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100%' }}>
                    {account.volatileDetails['Account.deviceID']}
                  </Typography>
                }
              />
            </ListItem>
            {devices.map((device) => (
              <ListItem key={device[0]}>
                <DevicesIcon
                  sx={{ padding: '4px', margin: '4px', marginRight: '16px', height: '40px', width: '40px' }}
                />
                <ListItemText
                  id="switch-list-label-rendezvous"
                  primary={device[1]}
                  secondary={
                    <Box maxWidth={'90%'}>
                      <EllipsisMiddle text={device[0]} />
                    </Box>
                  }
                />
                <TrashBinIcon sx={{ '&:hover': { cursor: 'pointer' } }} onClick={() => removeDevice(device[0])} />
              </ListItem>
            ))}
            {/* <ListItemTextsion> */}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  )
}

export default LinkedDevices
