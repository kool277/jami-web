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
import { Box, Divider, List, ListItem, ListItemText } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import { AdminSettingSelection } from 'jami-web-common'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'

import ProcessingRequest from '../../components/ProcessingRequest.js'
import { AuthenticationMethods } from '../../enums/authenticationMethods.js'
import rightChevron from '../../icons/rightChevron.svg'
import { useGetAdminConfigQuery } from '../../services/adminQueries.js'

export default function AuthMethods() {
  const { t } = useTranslation()
  const accessToken = localStorage.getItem('adminAccessToken')
  const { data } = useGetAdminConfigQuery()
  const [isLocalEnabled, setIsLocalEnabled] = useState(false)
  const [isJamsEnabled, setIsJamsEnabled] = useState(false)
  const [isOpenIdEnabled, setIsOpenIdEnabled] = useState(false)
  const [isGuestEnabled, setIsGuestEnabled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (data) {
      setIsLocalEnabled(data.localAuthEnabled)
      setIsJamsEnabled(data.jamsAuthEnabled)
      setIsOpenIdEnabled(data.openIdAuthEnabled)
      setIsGuestEnabled(data.guestAccessEnabled)
    }
  }, [data])

  if (!accessToken) {
    return <Navigate to="/admin/login" replace />
  }
  if (data === undefined) {
    return <ProcessingRequest open />
  }

  const handleAuthMethodSelection = async (authMethod: AuthenticationMethods) => {
    await new Promise((r) => setTimeout(r, 200))
    navigate(`/admin/${AdminSettingSelection.AUTHENTICATION}/${authMethod}`)
  }

  const listStyle = {
    py: 0,
    width: '100vw',
    maxWidth: '360px',
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    backgroundColor: 'background.paper',
    margin: '5%',
  }

  const listItemStyle = {
    width: '100%',
    borderRadius: '12px',
    textAlign: 'center',
    ':hover': { cursor: 'pointer' },
  }
  const listItemText = {
    ':hover': { fontWeight: 'bolder' },
  }

  const activeIndicatorStyle = {
    fontSize: '0.8rem',
    marginTop: '-0.4rem',
  }
  const disabledColor = '#CC0022'
  const enabledColor = '#00796B'

  return (
    <AnimatePresence>
      <motion.div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignContent: 'center',
          marginTop: '8%',
        }}
        initial={{ x: -20 }}
        animate={{ x: 0 }}
        exit={{ x: 20 }}
        transition={{ duration: 0.5 }}
      >
        <List sx={listStyle}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }}>
            <ListItem
              sx={listItemStyle}
              onClick={() => {
                handleAuthMethodSelection(AuthenticationMethods.JAMI)
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ textAlign: 'start' }}>
                  <ListItemText sx={listItemText} primary={t('jami')} />
                  <Box sx={activeIndicatorStyle} style={{ color: isLocalEnabled ? enabledColor : disabledColor }}>
                    {isLocalEnabled ? t('setting_enabled') : t('setting_disabled')}
                  </Box>
                </Box>
                <img src={rightChevron} alt=">" />
              </Box>
            </ListItem>
          </motion.div>
          <Divider variant="middle" component="li" />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }}>
            <ListItem
              sx={listItemStyle}
              onClick={() => {
                handleAuthMethodSelection(AuthenticationMethods.JAMS)
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ textAlign: 'start' }}>
                  <ListItemText sx={listItemText} primary={t('jams')} />
                  <Box sx={activeIndicatorStyle} style={{ color: isJamsEnabled ? enabledColor : disabledColor }}>
                    {isJamsEnabled ? t('setting_enabled') : t('setting_disabled')}
                  </Box>
                </Box>
                <img src={rightChevron} alt=">" />
              </Box>
            </ListItem>
          </motion.div>

          <Divider variant="middle" component="li" />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }}>
            <ListItem
              sx={listItemStyle}
              onClick={() => {
                handleAuthMethodSelection(AuthenticationMethods.OPENID)
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ textAlign: 'start' }}>
                  <ListItemText sx={listItemText} primary={t('openid')} />
                  <Box sx={activeIndicatorStyle} style={{ color: isOpenIdEnabled ? enabledColor : disabledColor }}>
                    {isOpenIdEnabled ? t('setting_enabled') : t('setting_disabled')}
                  </Box>
                </Box>
                <img src={rightChevron} alt=">" />
              </Box>
            </ListItem>
          </motion.div>
          <Divider variant="middle" component="li" />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }}>
            <ListItem
              sx={listItemStyle}
              onClick={() => {
                handleAuthMethodSelection(AuthenticationMethods.GUEST)
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ textAlign: 'start' }}>
                  <ListItemText sx={listItemText} primary={t('guest')} />
                  <Box sx={activeIndicatorStyle} style={{ color: isGuestEnabled ? enabledColor : disabledColor }}>
                    {isGuestEnabled ? t('setting_enabled') : t('setting_disabled')}
                  </Box>
                </Box>
                <img src={rightChevron} alt=">" />
              </Box>
            </ListItem>
          </motion.div>
        </List>
      </motion.div>
    </AnimatePresence>
  )
}
