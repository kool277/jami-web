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
import { Box, Grid, Paper, useMediaQuery } from '@mui/material'
import { alpha, Theme, useTheme } from '@mui/material/styles'
import React from 'react'
import { Navigate } from 'react-router-dom'

import { getAccessToken } from '../services/authQueries'
import JamiWelcomeLogo from './JamiWelcomeLogo'

export default function withAuthUI(WrappedComponent: React.FunctionComponent): React.FunctionComponent {
  return function WithAuthUI() {
    const borderRadius = 30

    const theme: Theme = useTheme()

    const isDesktopOrLaptop: boolean = useMediaQuery(theme.breakpoints.up('md'))
    const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))

    const accessToken = getAccessToken()

    if (accessToken) {
      return <Navigate to="/conversation" replace />
    }
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundImage: `url(./admin/background.jpg)`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <Paper
          elevation={10}
          sx={{
            width: '100%',
            backgroundColor: `transparent`,
            margin: `${isDesktopOrLaptop ? theme.typography.pxToRem(100) : 0}`,
            borderRadius: `${isDesktopOrLaptop ? theme.typography.pxToRem(borderRadius) : 0}`,
            overflow: 'hidden',
          }}
        >
          <Grid container spacing={0} sx={{ height: '100%' }}>
            {!isMobile && (
              <Grid
                item
                xs={5}
                id="logo"
                sx={{
                  height: '100%',
                  backgroundColor: alpha(theme.LoginPage.backgroundColor, 0.3),
                  borderRadius: `${
                    isDesktopOrLaptop
                      ? `${theme.typography.pxToRem(borderRadius)} 0 0 ${theme.typography.pxToRem(borderRadius)}`
                      : 0
                  }`, // To follow paper border-radius
                }}
              >
                <JamiWelcomeLogo logoWidth="90%" sx={{ height: '100%' }} />
              </Grid>
            )}
            <Grid item xs={isMobile ? 12 : 7} sx={{ height: '100%' }}>
              {isMobile && (
                <JamiWelcomeLogo
                  logoWidth={theme.typography.pxToRem(100)}
                  logoHeight={theme.typography.pxToRem(100)}
                  sx={{ mt: theme.typography.pxToRem(30), mb: theme.typography.pxToRem(20) }}
                />
              )}
              <Box sx={{ height: `${isMobile ? 'auto' : '100%'}`, backgroundColor: theme.palette.background.paper }}>
                <WrappedComponent />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    )
  }
}
