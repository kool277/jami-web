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
import GroupAddRounded from '@mui/icons-material/GroupAddRounded'
import { Box, Card, CardContent, Container, Fab, Input, Typography, useMediaQuery } from '@mui/material'
import { Theme, useTheme } from '@mui/material/styles'
import { motion } from 'framer-motion'
import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'

import jamiLogoIcon from '../icons/jamiLogoIcon.svg'
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
    return <Navigate to={'/admin'} />
  }
  //TODO: refactor translations
  return (
    <>
      <Container
        className="message-list"
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'auto',
          width: 1,
          borderRadius: borderRadius,
          minHeight: `${isMobile ? 'auto' : ''}`,
        }}
      >
        &nbsp;
        <Card
          variant="outlined"
          sx={{
            textAlign: 'center',
            paddingBottom: 8,
            marginTop: 20,
            width: `${isMobile ? '110%' : 1 / 1.5}`,
            background: `${isMobile ? 'white' : 'linear-gradient(200deg, #A3C2DA 50%, #FFFFFF)'}`,
            border: `${isMobile ? 0 : 1 / 2}`,
          }}
        >
          <CardContent component="form" onSubmit={handleSubmit}>
            <Typography
              gutterBottom
              variant="h5"
              component="h1"
              sx={{ textAlign: 'center', marginTop: 0, paddingBottom: 4, fontWeight: 'medium' }}
            >
              {t('admin_page_login_title')}
            </Typography>

            <motion.div
              initial={{ scale: 0.2 }}
              animate={{ rotate: 360, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 150,
                damping: 25,
              }}
              style={{ paddingBottom: 8 }}
            >
              <Box
                component="img"
                sx={{
                  height: 233,
                  width: 350,
                  maxHeight: { xs: 125, md: 167 },
                  maxWidth: { xs: 187, md: 250 },
                }}
                alt="Logo Savoir Faire Linux"
                src={jamiLogoIcon}
              />
            </motion.div>

            <Box style={{ textAlign: 'center', marginTop: 10 }}>
              <div>
                <Input value="admin" name="username" autoComplete="username" />
              </div>
              <div>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name="password"
                  type="password"
                  placeholder={t('password_placeholder')}
                  autoComplete="new-password"
                  required
                  disabled={isPending}
                />
              </div>
            </Box>
            <Box style={{ textAlign: 'center', marginTop: 24 }}>
              <Fab variant="extended" color="primary" type="submit" disabled={isPending}>
                {t('login_form_submit_button')}
                &nbsp;&nbsp;
                <GroupAddRounded />
              </Fab>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  )
}
