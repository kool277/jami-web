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
import LogoutIcon from '@mui/icons-material/Logout'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import { Box, Card, Menu, MenuItem, useMediaQuery, useTheme } from '@mui/material'
import { MouseEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthContext } from '../contexts/AuthProvider'
import { useContactProfilePicture } from '../services/contactQueries'
import ConversationAvatar from './ConversationAvatar'
import QrCodeModal from './QrCodeModal'
import { RoundCloseIcon, SettingsIcon } from './SvgIcon'
//TODO:  remove 'settings-account' and 'settings' when migration is finished
type NavigateURL =
  | '/'
  | '/contacts'
  | '/settings/general'
  | '/settings/account/manage-account'
  | '/settings/account/linked-devices'

export default function Footer() {
  const { t } = useTranslation()
  const { logout } = useAuthContext()
  const { account } = useAuthContext()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const navigate = useNavigate()
  const theme = useTheme()
  const profilePictureQuery = useContactProfilePicture(account.getUri())
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget)
  const closeMenuAndNavigate = (navigateUrl?: NavigateURL) => {
    setAnchorEl(null)
    if (navigateUrl) {
      navigate(navigateUrl)
    }
  }
  const componentColor = theme.Footer.backgroundColor

  const componentSize = '25px'

  const location = useLocation()
  const currentUrl = location.pathname

  const menuItemStyle = {
    display: 'flex',
    justifyContent: 'flex-start',
    width: '100%',
  }

  const footerIcons = { padding: '2px', height: componentSize, width: componentSize, '&:hover': { cursor: 'pointer' } }

  return (
    <>
      <Card
        sx={{
          backgroundColor: componentColor,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: isMobile ? 'none' : '360px',
          height: '50px',
          margin: '4px',
          borderRadius: '10px',
        }}
      >
        <Box
          sx={{
            marginLeft: '4px',
            paddingLeft: '4px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: isMobile ? 'none' : '200px',
            '&:hover': { cursor: 'pointer' },
            textAlign: 'right',
            padding: '4px',
            height: '100%',
          }}
          onClick={(event: MouseEvent<HTMLDivElement>) => {
            handleClick(event as unknown as MouseEvent<HTMLButtonElement>)
          }}
        >
          <ConversationAvatar
            sx={{ marginLeft: '3px', marginRight: '2%' }}
            displayName={account.getDisplayName() || account.getRegisteredName()}
            contactUri={account.getUri()}
            src={profilePictureQuery.data}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: '8px', height: '100%', marginTop: '8px' }}>
            <Box
              sx={{
                justifyContent: 'flex-start',
                textWrap: 'nowrap',
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: isMobile ? '200px' : '150px',
              }}
            >
              {account.getDisplayName()}
            </Box>
            <Box
              sx={{
                fontSize: '10px',
                justifyContent: 'flex-start',
                textWrap: 'nowrap',
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: isMobile ? '200px' : '120px',
                color: 'grey',
                marginLeft: '1px',
              }}
            >
              {account.getDisplayName() !== account.getRegisteredName() && account.getRegisteredName()}
            </Box>
          </Box>
        </Box>

        <Menu
          id="simple-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => closeMenuAndNavigate()}
          PaperProps={{
            sx: (theme) => ({
              width: 'auto',
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              borderRadius: '20px 5px 20px 5px',
              boxShadow: '3px 3px 7px #00000029',
            }),
          }}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <div>
            {currentUrl.split('/').pop() !== '' && (
              <>
                <MenuItem onClick={() => closeMenuAndNavigate(`/`)}>
                  <div style={menuItemStyle}>
                    <QuestionAnswerIcon sx={{ marginRight: '5%' }} />
                    {t('conversations')}
                  </div>
                </MenuItem>
              </>
            )}
            <MenuItem onClick={() => closeMenuAndNavigate(`/contacts`)}>
              <div style={menuItemStyle}>
                <PeopleAltIcon sx={{ marginRight: '5%' }} />
                {t('settings_menu_item_contacts')}
              </div>
            </MenuItem>
            <MenuItem onClick={() => closeMenuAndNavigate(`/settings/account/manage-account`)}>
              <div style={menuItemStyle}>
                <ManageAccountsIcon sx={{ marginRight: '5%' }} />
                {t('settings_manage_account')}
              </div>
            </MenuItem>
            <MenuItem data-cy="logout-button" onClick={logout}>
              <div style={menuItemStyle}>
                <LogoutIcon sx={{ marginRight: '5%', color: '#FA2E30' }} />
                {t('logout')}
              </div>
            </MenuItem>
          </div>
        </Menu>

        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            color: theme.Footer.iconsColor,
            gap: '10px',
            margin: '8px',
          }}
        >
          <QrCodeModal account={account} />

          {!currentUrl.includes('settings') ? (
            <SettingsIcon
              sx={footerIcons}
              onClick={() => {
                closeMenuAndNavigate('/settings/account/manage-account')
              }}
            />
          ) : (
            <RoundCloseIcon
              sx={footerIcons}
              onClick={() => {
                closeMenuAndNavigate('/')
              }}
            />
          )}
        </Box>
      </Card>
    </>
  )
}
