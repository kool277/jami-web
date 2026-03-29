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
import { Box, Fab, TextField, Typography, useMediaQuery } from '@mui/material'
import { Theme, useTheme } from '@mui/material/styles'
import { AdminSettingSelection } from 'jami-web-common'
import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'

import { GroupAddRoundedIcon as GroupAddRounded } from '../components/SvgIcon'
import UnconnectedUserLayout from '../components/UnconnectedUserLayout'
import logoIcon from '../icons/jamiLogoIcon.svg'
import { useLoginAdminMutation } from '../services/adminQueries'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const { t } = useTranslation()
  const loginAdminMutation = useLoginAdminMutation()
  const { isPending } = loginAdminMutation
  const theme: Theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const borderRadius = 30

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (password === '') return
    loginAdminMutation.mutate(password)
  }

  if (localStorage.getItem('adminAccessToken')) {
    return <Navigate to={'/admin/' + AdminSettingSelection.ACCOUNTS} />
  }
  //TODO: refactor translations

  const titleStyle = {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  }

  return (
    <>
      <UnconnectedUserLayout>
        <Box sx={{ ...titleStyle }}>
          <img
            src={logoIcon}
            alt={t('app_name')}
            style={{ width: '20%', height: 'auto', borderRadius: borderRadius, marginRight: '15px' }}
          />
          <Typography variant="h4" style={{ marginTop: 10, marginRight: '15px' }}>
            {t('admin_page_login_title')}
          </Typography>
        </Box>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Typography>{t('admin_page_login_subtitle')}</Typography>
        </Box>
        <Box sx={isMobile ? { height: '60%' } : { mt: 2 }}>
          <Box style={{ textAlign: 'center', marginTop: 10 }}>
            <div>
              <TextField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                name="password"
                type="password"
                label={t('password_placeholder')}
                autoComplete="new-password"
                required
                disabled={isPending}
                size="small"
              />
            </div>
          </Box>
          <Box style={{ textAlign: 'center', marginTop: 24 }} onClick={handleSubmit}>
            <Fab variant="extended" color="primary" type="submit" disabled={isPending}>
              {t('login_form_submit_button')}
              &nbsp;&nbsp;
              <GroupAddRounded />
            </Fab>
          </Box>
        </Box>
        <Box
          sx={{
            mt: theme.typography.pxToRem(32),
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body1" fontSize={13}>
            <Link style={{ color: theme.ChatInterface.inputColor }} to={'/'}>
              {t('admin_login_to_main')}
            </Link>
          </Typography>
        </Box>
      </UnconnectedUserLayout>
    </>
  )
}
