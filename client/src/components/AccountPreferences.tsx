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
import {
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
  Paper,
  Switch,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import { motion } from 'framer-motion'
import { AccountDetails } from 'jami-web-common'
import { useState } from 'react'

import { useAuthContext } from '../contexts/AuthProvider.js'
import { thumbnailVariants } from '../themes/MotionVariants.js'
import CustomizeProfile from './AccountSettings/CustomizeProfile.js'
import LinkedDevicesPreview from './AccountSettings/LinkedDevicesPreview.js'
import PasskeyManager from './AccountSettings/PasskeyManager.js'
import ConversationAvatar from './ConversationAvatar.js'
import ConversationsOverviewCard from './ConversationsOverviewCard.js'
import JamiIdCard from './JamiIdCard.js'
import {
  AddCircleIcon as AddCircle,
  AudioCallIcon as PhoneCallbackRounded,
  DeleteIcon as DeleteRounded,
  GroupsIcon as GroupRounded,
} from './SvgIcon.js'

export default function AccountPreferences() {
  const { account, axiosInstance } = useAuthContext()

  const devices: string[][] = []
  const accountDevices = account.devices
  for (const i in accountDevices) devices.push([i, accountDevices[i]])

  const isJamiAccount = account.getType() === 'RING'
  const alias = isJamiAccount ? 'Jami account' : 'SIP account'
  const moderators = account.defaultModerators
  const [defaultModeratorUri, setDefaultModeratorUri] = useState('')

  const [details, setDetails] = useState(account.details)

  const addModerator = async () => {
    if (defaultModeratorUri) {
      await axiosInstance.put(`/default-moderators/${defaultModeratorUri}`)
      setDefaultModeratorUri('')
    }
  }

  const removeModerator = async (uri: string) => await axiosInstance.delete(`/default-moderators/${uri}`)

  const handleToggle = async (key: keyof AccountDetails, value: boolean) => {
    const newDetails: Partial<AccountDetails> = {}
    newDetails[key] = value ? 'true' : 'false'
    await axiosInstance.patch('/account', newDetails)
    account.updateDetails(newDetails)
    setDetails(account.details)
  }

  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={{
        enter: { transition: { staggerChildren: 0.05 } },
        exit: { transition: { staggerChildren: 0.02 } },
      }}
    >
      <motion.div variants={thumbnailVariants}>
        <Typography variant="h2" component="h2" gutterBottom>
          {alias}
        </Typography>
      </motion.div>
      <Box sx={{ mb: '16px' }}>
        <CustomizeProfile />
      </Box>
      <Grid container spacing={3} style={{ marginBottom: 16 }}>
        {isJamiAccount && (
          <Grid size={12}>
            <motion.div variants={thumbnailVariants}>
              <JamiIdCard account={account} />
            </motion.div>
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 6 }}>
          <motion.div variants={thumbnailVariants}>
            <ConversationsOverviewCard />
          </motion.div>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <motion.div variants={thumbnailVariants}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Current calls
                </Typography>
                <Typography gutterBottom variant="h5" component="h2">
                  0
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={12}>
          <motion.div variants={thumbnailVariants} style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
            <LinkedDevicesPreview />
          </motion.div>
        </Grid>

        <Grid size={12}>
          <motion.div variants={thumbnailVariants}>
            <PasskeyManager />
          </motion.div>
        </Grid>
      </Grid>
      <List
        subheader={
          <motion.div variants={thumbnailVariants}>
            <ListSubheader>Settings</ListSubheader>
          </motion.div>
        }
      >
        <motion.div variants={thumbnailVariants}>
          <ListItem>
            <ListItemIcon>
              <GroupRounded />
            </ListItemIcon>
            <ListItemText id="switch-list-label-rendezvous" primary="Rendez-Vous point" />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                onChange={(e) => handleToggle('Account.rendezVous', e.target.checked)}
                checked={details['Account.rendezVous'] === 'true'}
                slotProps={{
                  input: {
                    'aria-labelledby': 'switch-list-label-rendezvous',
                  },
                }}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </motion.div>
        <motion.div variants={thumbnailVariants}>
          <ListItem>
            <ListItemIcon>
              <PhoneCallbackRounded />
            </ListItemIcon>
            <ListItemText id="switch-list-label-publicin" primary="Allow connection from unknown peers" />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                onChange={(e) => handleToggle('DHT.PublicInCalls', e.target.checked)}
                checked={details['DHT.PublicInCalls'] === 'true'}
                slotProps={{
                  input: { 'aria-labelledby': 'switch-list-label-publicin' },
                }}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </motion.div>
        <motion.div variants={thumbnailVariants}>
          <Paper>
            <Toolbar>
              <Typography variant="h6">Default moderators</Typography>
            </Toolbar>
            <List>
              <ListItem key="add">
                <TextField
                  variant="outlined"
                  value={defaultModeratorUri}
                  onChange={(e) => setDefaultModeratorUri(e.target.value)}
                  label="Add new default moderator"
                  placeholder="Enter new moderator name or URI"
                  size="small"
                  fullWidth
                />
                <ListItemSecondaryAction>
                  <IconButton onClick={addModerator} size="large">
                    <AddCircle />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {moderators.length === 0 ? (
                <ListItem key="placeholder">
                  <ListItemText primary="No default moderator" />
                </ListItem>
              ) : (
                moderators.map((moderator) => (
                  <ListItem key={moderator.uri}>
                    <ListItemAvatar>
                      <ConversationAvatar displayName={moderator.getDisplayName()} contactUri={moderator.uri} />
                    </ListItemAvatar>
                    <ListItemText primary={moderator.getDisplayName()} />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => removeModerator(moderator.uri)} size="large">
                        <DeleteRounded />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </motion.div>
      </List>
    </motion.div>
  )
}
