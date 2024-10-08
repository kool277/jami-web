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
import { Stack, StackProps, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import JamiLogo from '../icons/jamiLogoIcon.svg?react'
import { jamiLogoDefaultSize } from '../utils/constants'

interface WelcomeLogoProps extends StackProps {
  logoWidth?: string
  logoHeight?: string
}

export default function JamiWelcomeLogo({ logoWidth, logoHeight, ...stackProps }: WelcomeLogoProps) {
  const { t } = useTranslation()

  return (
    <Stack
      {...stackProps}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...stackProps.sx,
      }}
    >
      <Typography variant="h2" fontWeight={'bolder'} sx={{ marginTop: '6vh', paddingBottom: '2vh', color: 'black' }}>
        {t('welcome_to_text')}
      </Typography>
      <JamiLogo width={logoWidth ?? jamiLogoDefaultSize} height={logoHeight ?? jamiLogoDefaultSize} />
      <img
        src={'./jamiTitle.png'}
        alt="Jami"
        width={'50%'}
        height={'auto'}
        style={{ marginLeft: '-2.5vw', marginBottom: '10vh' }}
      />
    </Stack>
  )
}
