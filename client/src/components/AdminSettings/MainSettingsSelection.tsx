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
import { Box, Button } from '@mui/material'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { t } from 'i18next'
import { AdminSettingSelection } from 'jami-web-common'
import { useNavigate } from 'react-router-dom'

const listStyle = {
  py: 0,
  width: '100%',
  maxWidth: 360,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  backgroundColor: 'background.paper',
  margin: '5%',
}

const listItemTextStyle = {
  textAlign: 'start',
}

export default function MainSettingsSelection() {
  const navigate = useNavigate()

  const handleClick = (value: string) => {
    navigate(`/admin/${value}`)
  }

  const adminLogout = () => {
    localStorage.removeItem('adminAccessToken')
    navigate('/admin/login')
  }

  const borderRadiusValue = '7px'

  return (
    <>
      <List sx={listStyle}>
        <ListItem
          sx={{
            borderRadius: borderRadiusValue,
            textAlign: 'center',
            ':hover': { backgroundColor: 'primary.light', cursor: 'pointer' },
          }}
          onClick={() => handleClick(AdminSettingSelection.ACCOUNTS)}
        >
          <ListItemText sx={listItemTextStyle} primary="Accounts" />
        </ListItem>
        <Divider variant="middle" component="li" />
        <ListItem
          sx={{
            borderRadius: borderRadiusValue,
            textAlign: 'center',
            ':hover': { backgroundColor: 'primary.light', cursor: 'pointer' },
          }}
          onClick={() => handleClick(AdminSettingSelection.AUTHENTICATION)}
        >
          <ListItemText sx={listItemTextStyle} primary="Authentication" />
        </ListItem>
        <Divider variant="middle" component="li" />
        <ListItem
          sx={{
            borderRadius: borderRadiusValue,
            textAlign: 'center',
            ':hover': { backgroundColor: 'primary.light', cursor: 'pointer' },
          }}
          onClick={() => handleClick(AdminSettingSelection.ADMIN_ACCOUNT_CONFIGURATION)}
        >
          <ListItemText sx={listItemTextStyle} primary="Admin account configuration" />
        </ListItem>
      </List>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', marginLeft: '10%' }}>
        <Button variant="contained" type="submit" onClick={adminLogout}>
          {t('logout')}
        </Button>
      </Box>
    </>
  )
}
