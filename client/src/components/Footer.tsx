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
import { Box, Button, Divider, Menu, MenuItem, useMediaQuery, useTheme } from '@mui/material'
import { MouseEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthContext } from '../contexts/AuthProvider'
import roundCloseIcon from '../icons/roundCloseIcon.svg'
import SettingsIcon from '../icons/setting.svg'
import { useContactProfilePicture } from '../services/contactQueries'
import ConversationAvatar from './ConversationAvatar'
import QrCodeModal from './QrCodeModal'
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
  const margin = '3px'
  const padding = '5px'
  const componentColor = theme.Footer.backgroundColor

  const location = useLocation()
  const currentUrl = location.pathname

  const menuItemStyle = {
    display: 'flex',
    justifyContent: 'flex-start',
    width: '100%',
  }

  return (
    <>
      <Box
        sx={{
          backgroundColor: componentColor,
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          maxWidth: isMobile ? 'none' : '360px',
          borderRadius: '3px',
          padding: '0.5%',
          paddingBottom: '2%',
          paddingLeft: '2%',
          paddingRight: '2%',
          paddingTop: '4%',
          height: '70px',
        }}
      >
        <Box
          sx={{
            margin: margin,
            fontSize: '14px',
            backgroundColor: componentColor,
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: isMobile ? 'none' : '200px',
            '&:hover': { cursor: 'pointer', backgroundColor: '#f0f0f0', color: 'black' },
            textAlign: 'right',
            padding: '4px',
          }}
          onClick={(event: MouseEvent<HTMLDivElement>) => {
            handleClick(event as unknown as MouseEvent<HTMLButtonElement>)
          }}
        >
          <ConversationAvatar
            sx={{ marginLeft: '3px', marginRight: '2%' }}
            displayName={account.getDisplayName()}
            src={profilePictureQuery.data}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', marginLeft: '2%' }}>
            <Box
              sx={{
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: isMobile ? 'none' : '77px',
                maxHeight: '45px',
              }}
            >
              {account.getDisplayName()}
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
                <Divider />
              </>
            )}
            <MenuItem onClick={() => closeMenuAndNavigate(`/contacts`)}>
              <div style={menuItemStyle}>
                <PeopleAltIcon sx={{ marginRight: '5%' }} />
                {t('settings_menu_item_contacts')}
              </div>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => closeMenuAndNavigate(`/settings/account/manage-account`)}>
              <div style={menuItemStyle}>
                <ManageAccountsIcon sx={{ marginRight: '5%' }} />
                {t('settings_manage_account')}
              </div>
            </MenuItem>
            <Divider />
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
            margin: margin,
            padding: padding,
            backgroundColor: componentColor,
            color: theme.Footer.iconsColor,
          }}
        >
          <QrCodeModal account={account} />
        </Box>
        <Box
          style={{
            marginLeft: '-5px',
            marginRight: '0px',
            padding: padding,
            backgroundColor: componentColor,
            color: theme.Footer.iconsColor,
          }}
        >
          <Button
            sx={{ margin: margin, padding: padding, backgroundColor: componentColor, color: theme.Footer.iconsColor }}
            data-cy="menu-button"
            aria-controls="simple-menu"
            aria-haspopup="true"
            onClick={
              !currentUrl.includes('settings')
                ? () => closeMenuAndNavigate('/settings/account/manage-account')
                : () => closeMenuAndNavigate('/')
            }
          >
            <img src={!currentUrl.includes('settings') ? SettingsIcon : roundCloseIcon} />
          </Button>
        </Box>
      </Box>
    </>
  )
}
