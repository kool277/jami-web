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
import { Box, Card, Divider, IconButton, Menu, MenuItem, Stack, useMediaQuery, useTheme } from '@mui/material'
import axios from 'axios'
import { MouseEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthContext } from '../contexts/AuthProvider'
import { setAccessToken } from '../services/authQueries'
import { useContactProfilePicture } from '../services/contactQueries'
import { apiUrl } from '../utils/constants'
import { isElectronMode } from '../utils/electron'
import ConversationAvatar from './ConversationAvatar'
import QrCodeModal from './QrCodeModal'
import { LogoutIcon, ManageAccountsIcon, PeopleIcon, QuestionAnswerIcon } from './SvgIcon'
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
  const [localAccounts, setLocalAccounts] = useState<string[]>([])
  const navigate = useNavigate()
  const theme = useTheme()
  const profilePictureQuery = useContactProfilePicture(account.getUri())
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const electron = isElectronMode()

  useEffect(() => {
    if (!electron) return
    axios.get<{ usernames: string[] }>('/auth/local-accounts', { baseURL: apiUrl }).then(({ data }) => {
      setLocalAccounts(data.usernames)
    })
  }, [electron])
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget)
  const closeMenuAndNavigate = (navigateUrl?: NavigateURL) => {
    setAnchorEl(null)
    if (navigateUrl) {
      navigate(navigateUrl)
    }
  }

  const switchAccount = async (username: string) => {
    setAnchorEl(null)
    const { data } = await axios.post(
      '/auth/login',
      { username, password: '', authMethod: 'local' },
      { baseURL: apiUrl },
    )
    setAccessToken(data.accessToken)
    window.location.href = '/conversation'
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
          margin: theme.Panel.padding,
          borderRadius: '9999px',
        }}
      >
        <Box
          sx={{
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: isMobile ? 'none' : '200px',
            '&:hover': { cursor: 'pointer' },
            pl: theme.Panel.padding,
            py: theme.Panel.itemPadding,
            pr: 0,
            height: '100%',
          }}
          onClick={(event: MouseEvent<HTMLDivElement>) => {
            handleClick(event as unknown as MouseEvent<HTMLButtonElement>)
          }}
        >
          <ConversationAvatar
            sx={{ mr: theme.Panel.padding }}
            displayName={account.getDisplayName() || account.getRegisteredName()}
            contactUri={account.getUri()}
            src={profilePictureQuery.data}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                color: 'text.secondary',
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
              borderRadius: '20px 12px 20px 12px',
              boxShadow: '3px 3px 7px rgba(0, 0, 0, 0.16)',
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
            {electron && localAccounts.length > 1 && (
              <>
                {localAccounts
                  .filter((username) => username !== account.getRegisteredName())
                  .map((username) => (
                    <MenuItem key={username} onClick={() => switchAccount(username)}>
                      <div style={menuItemStyle}>
                        <PeopleIcon sx={{ marginRight: '5%' }} />
                        {username}
                      </div>
                    </MenuItem>
                  ))}
                <Divider />
              </>
            )}
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
            {/*<MenuItem onClick={() => closeMenuAndNavigate(`/contacts`)}>
              <div style={menuItemStyle}>
                <PeopleAltIcon sx={{ marginRight: '5%' }} />
                {t('settings_menu_item_contacts')}
              </div>
            </MenuItem>*/}
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

        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            color: theme.Footer.iconsColor,
            pr: theme.Panel.itemPadding,
          }}
        >
          <QrCodeModal account={account} />

          {!currentUrl.includes('settings') ? (
            <IconButton
              size="small"
              sx={{ color: 'inherit' }}
              onClick={() => {
                closeMenuAndNavigate('/settings/account/manage-account')
              }}
            >
              <SettingsIcon />
            </IconButton>
          ) : (
            <IconButton
              size="small"
              sx={{ color: 'inherit' }}
              onClick={() => {
                closeMenuAndNavigate('/')
              }}
            >
              <RoundCloseIcon />
            </IconButton>
          )}
        </Stack>
      </Card>
    </>
  )
}
