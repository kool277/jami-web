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

import { Box, Button } from '@mui/material'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAuthContext } from '../../contexts/AuthProvider'

function LinkedDevicesPreview() {
  const { account } = useAuthContext()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const seeAllDevices = () => {
    navigate('/settings/account/linked-devices')
  }

  const linkNewDevice = () => {
    navigate('/settings/account/linked-devices/export')
  }

  return (
    <Grid item xs={12} sm={12} aria-label="linked-device">
      <Card>
        <CardContent sx={{ width: '100%' }}>
          <Typography sx={{}} color="textSecondary" gutterBottom>
            {t('devices')}
          </Typography>
          <Typography gutterBottom variant="h5" component="h2">
            <ListItem>
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
          </Typography>
          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-evenly' }}>
            <Button onClick={seeAllDevices} variant="contained">
              {t('see_all_devices')}
            </Button>
            <Button onClick={linkNewDevice} variant="contained">
              {t('link_new_device')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  )
}

export default LinkedDevicesPreview
