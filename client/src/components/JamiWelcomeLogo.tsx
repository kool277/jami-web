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
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import JamiLogo from '../icons/jamiLogoIcon.svg?react'
import { jamiLogoDefaultSize } from '../utils/constants'

interface WelcomeLogoProps extends StackProps {
  logoWidth?: string
  logoHeight?: string
  displayText?: boolean
}

export default function JamiWelcomeLogo({ logoWidth, logoHeight, displayText, ...stackProps }: WelcomeLogoProps) {
  const { t } = useTranslation()
  const [isTextDisplayed, setIsTextDisplayed] = useState<boolean>(true)
  if (displayText !== undefined && displayText !== isTextDisplayed) {
    setIsTextDisplayed(displayText)
  }
  return (
    <Stack
      {...stackProps}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        ...stackProps.sx,
      }}
    >
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
        <JamiLogo width={logoWidth ?? jamiLogoDefaultSize} height={logoHeight ?? jamiLogoDefaultSize} />
      </motion.div>
      {isTextDisplayed ? <Typography variant="h2">{t('welcome_text')}</Typography> : null}
    </Stack>
  )
}
