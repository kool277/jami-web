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

import { Box, Divider, List, ListItem, ListItemText, Typography } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import { AdminSettingSelection } from 'jami-web-common'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { AuthenticationMethods } from '../../enums/authenticationMethods.js'
import rightChevron from '../../icons/rightChevron.svg'
import { useGetAdminConfigQuery, useGetAllOauthClients } from '../../services/adminQueries.js'
import ProcessingRequest from '../ProcessingRequest.js'

export default function OpenIdAuthMethod() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data } = useGetAdminConfigQuery()
  const providers = useGetAllOauthClients()

  if (data === undefined || providers.data === undefined) {
    return <ProcessingRequest open />
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

  const handleSelection = (provider: string) => {
    navigate(`/admin/${AdminSettingSelection.AUTHENTICATION}/${AuthenticationMethods.OPENID}/${provider}`)
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%', width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '350px', gap: '20px' }}>
        <Box>
          <Typography variant="h6">{t('openid_authentication')}</Typography>
        </Box>
        <AnimatePresence>
          <motion.div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignContent: 'center',
            }}
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            exit={{ x: 20 }}
            transition={{ duration: 0.5 }}
          >
            <List sx={listStyle}>
              {providers.data.map((provider: any) => (
                <>
                  <motion.div key={provider.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }}>
                    <ListItem
                      sx={listItemStyle}
                      onClick={() => {
                        handleSelection(provider.name)
                      }}
                    >
                      <Box
                        sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}
                      >
                        <Box sx={{ textAlign: 'start' }}>
                          <ListItemText sx={listItemText} primary={provider.displayName} />
                          <Box
                            sx={activeIndicatorStyle}
                            style={{ color: provider.isActive ? enabledColor : disabledColor }}
                          >
                            {provider.isActive ? t('setting_enabled') : t('setting_disabled')}
                          </Box>
                        </Box>
                        <img src={rightChevron} alt=">" />
                      </Box>
                    </ListItem>
                  </motion.div>
                  {providers.data.length - 1 !== providers.data.indexOf(provider) && (
                    <Divider variant="middle" component="li" />
                  )}
                </>
              ))}
            </List>
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  )
}
