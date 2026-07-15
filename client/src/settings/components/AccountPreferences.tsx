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
import { Box, Card, CardContent, Grid, Typography } from '@mui/material'
import { motion } from 'framer-motion'

import ConversationsOverviewCard from '../../components/ConversationsOverviewCard.js'
import JamiIdCard from '../../components/JamiIdCard.js'
import { useAuthContext } from '../../contexts/AuthProvider.js'
import { thumbnailVariants } from '../../themes/MotionVariants.js'
import CustomizeProfile from './AccountSettings/CustomizeProfile.js'
import LinkedDevicesPreview from './AccountSettings/LinkedDevicesPreview.js'
import PasskeyManager from './AccountSettings/PasskeyManager.js'

export default function AccountPreferences() {
  const { account } = useAuthContext()

  const isJamiAccount = account.getType() === 'RING'
  const alias = isJamiAccount ? 'Jami account' : 'SIP account'

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
    </motion.div>
  )
}
