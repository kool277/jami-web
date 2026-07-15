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
import { Box, Card, CardContent, CardHeader, Container, Typography, useMediaQuery, useTheme } from '@mui/material'
import { motion } from 'framer-motion'

import SettingLanguage from './SettingLanguage.js'

interface UnconnectedUserLayoutProps {
  pageName?: string
  children: React.ReactNode
  message?: string
}

export default function UnconnectedUserLayout({ pageName, children, message }: UnconnectedUserLayoutProps) {
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))

  const mainContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  }

  const cardStyle = {
    width: isMobile ? '100vw' : '450px',
    padding: isMobile ? '8px' : '16px 24px',
    marginTop: isMobile ? '0' : '-5%',
    overflowY: 'auto',
    borderRadius: isMobile ? '0' : '24px',
  }

  const isDark = theme.palette.mode === 'dark'
  const bgImage = isDark ? './admin/background_dark.jpg' : './admin/background.jpg'

  const backgroundStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    backgroundImage: `url(${bgImage})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    transition: 'background-image 0.5s ease-in-out',
  }

  return (
    <>
      <Box sx={{ position: 'absolute', right: '0', padding: '1px' }}>
        <SettingLanguage doNotDisplayLabel={true}></SettingLanguage>
      </Box>
      <Box sx={backgroundStyle}>
        <Container className="message-list" sx={mainContainerStyle}>
          <motion.div
            initial={{ y: isMobile ? 0 : -15, opacity: isMobile ? 1 : 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={cardStyle}>
              <CardHeader title={pageName} />
              <CardContent
                sx={
                  isMobile
                    ? {
                        width: '100%',
                        height: '90%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }
                    : {}
                }
                component="div"
              >
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Typography
                    variant="body2"
                    style={{ textAlign: 'start' }}
                    sx={{
                      width: '400px',
                    }}
                  >
                    {message}
                  </Typography>
                </Box>
                <Box
                  sx={
                    isMobile
                      ? {
                          height: '80%',
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }
                      : {}
                  }
                >
                  {children}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Container>
      </Box>
    </>
  )
}
