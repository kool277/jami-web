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
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { AccountDetails } from '@savoirfairelinux/jami-web-common'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import ConversationAvatar from '../../components/ConversationAvatar.js'
import {
  AddCircleIcon as AddCircle,
  AudioCallIcon as PhoneCallbackRounded,
  DeleteIcon as DeleteRounded,
  GroupsIcon as GroupRounded,
} from '../../components/SvgIcon.js'
import { useAuthContext } from '../../contexts/AuthProvider.js'
import { thumbnailVariants } from '../../themes/MotionVariants.js'

export default function CallPreferences() {
  const { t } = useTranslation()
  const { account, axiosInstance } = useAuthContext()

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
          {t('settings_calls')}
        </Typography>
      </motion.div>

      <Stack spacing={2}>
        <motion.div variants={thumbnailVariants}>
          <Card>
            <List>
              <ListItem>
                <ListItemIcon>
                  <GroupRounded />
                </ListItemIcon>
                <ListItemText
                  id="switch-list-label-rendezvous"
                  primary={t('settings_rendezvous_point')}
                  secondary={t('settings_rendezvous_point_description')}
                />
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
              </ListItem>
            </List>
          </Card>
        </motion.div>

        <motion.div variants={thumbnailVariants}>
          <Card>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PhoneCallbackRounded />
                </ListItemIcon>
                <ListItemText
                  id="switch-list-label-publicin"
                  primary={t('settings_allow_unknown_peers')}
                  secondary={t('settings_allow_unknown_peers_description')}
                />
                <Switch
                  edge="end"
                  onChange={(e) => handleToggle('DHT.PublicInCalls', e.target.checked)}
                  checked={details['DHT.PublicInCalls'] === 'true'}
                  slotProps={{
                    input: { 'aria-labelledby': 'switch-list-label-publicin' },
                  }}
                />
              </ListItem>
            </List>
          </Card>
        </motion.div>

        <motion.div variants={thumbnailVariants}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('settings_default_moderators')}
              </Typography>
              <List>
                <ListItem key="add">
                  <TextField
                    variant="outlined"
                    value={defaultModeratorUri}
                    onChange={(e) => setDefaultModeratorUri(e.target.value)}
                    label={t('settings_add_moderator')}
                    placeholder={t('settings_add_moderator_placeholder')}
                    size="small"
                    fullWidth
                  />
                  <IconButton onClick={addModerator} size="large">
                    <AddCircle />
                  </IconButton>
                </ListItem>
                {moderators.length === 0 ? (
                  <ListItem key="placeholder">
                    <ListItemText primary={t('settings_no_moderator')} />
                  </ListItem>
                ) : (
                  moderators.map((moderator) => (
                    <ListItem key={moderator.uri}>
                      <ListItemAvatar>
                        <ConversationAvatar displayName={moderator.getDisplayName()} contactUri={moderator.uri} />
                      </ListItemAvatar>
                      <ListItemText primary={moderator.getDisplayName()} />
                      <IconButton onClick={() => removeModerator(moderator.uri)} size="large">
                        <DeleteRounded />
                      </IconButton>
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </motion.div>
      </Stack>
    </motion.div>
  )
}
