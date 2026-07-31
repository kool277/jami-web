/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
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
import { Box, List, ListItem, type ListItemProps, Stack, type StackProps, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

import Island, { ISLAND_MARGIN, ISLAND_PADDING } from '../../components/common/Island.js'
import { thumbnailVariants } from '../../themes/MotionVariants.js'

interface SettingsPageProps {
  title?: string
  description?: string
  descriptionOnOwnLine?: boolean
  icon?: ReactNode
  headerAction?: ReactNode
  headerEndAction?: ReactNode
  sectionGap?: number
  children?: ReactNode
}

export function SettingsPage({
  title,
  description,
  descriptionOnOwnLine = false,
  icon,
  headerAction,
  headerEndAction,
  sectionGap = 2,
  children,
}: SettingsPageProps) {
  const hasHeader = title || description || icon || headerAction || headerEndAction

  return (
    <Box component="article" sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <Stack sx={{ width: '100%', maxWidth: 680, mx: 'auto', p: ISLAND_MARGIN }}>
        <Island data-testid="settings-page-island" sx={{ p: ISLAND_PADDING, gap: 0, boxShadow: 2 }}>
          {hasHeader && (
            <Stack sx={{ px: 2, pt: { xs: 2, md: 1 }, pb: description ? 0 : 1 }}>
              <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: 'center' }}>
                {headerAction}
                {icon}
                <Stack sx={{ gap: 0.5 }}>
                  {title && (
                    <Typography component="h1" variant="h3">
                      {title}
                    </Typography>
                  )}
                  {description && !descriptionOnOwnLine && (
                    <Typography color="text.secondary" variant="body2">
                      {description}
                    </Typography>
                  )}
                </Stack>
                {headerEndAction && <Box sx={{ ml: 'auto', flexShrink: 0 }}>{headerEndAction}</Box>}
              </Stack>
              {description && descriptionOnOwnLine && (
                <Typography color="text.secondary" variant="body2" sx={{ mt: 1.5 }}>
                  {description}
                </Typography>
              )}
            </Stack>
          )}
          <motion.div
            initial="initial"
            animate="enter"
            exit="exit"
            variants={{
              ...thumbnailVariants,
              enter: { ...thumbnailVariants.enter, transition: { staggerChildren: 0.05 } },
            }}
          >
            <Stack sx={{ gap: sectionGap }}>{children}</Stack>
          </motion.div>
        </Island>
      </Stack>
    </Box>
  )
}

interface SettingsSectionProps extends StackProps {
  title?: string
  description?: string
  list?: boolean
  children?: ReactNode
}

export function SettingsSection({ title, description, list = true, children, ...props }: SettingsSectionProps) {
  const hasContent = children !== undefined && children !== null
  const heading = (title || description) && (
    <Stack sx={{ gap: 0.25 }}>
      {title && (
        <Typography
          component="h2"
          variant="body1"
          sx={{ color: (theme) => theme.palette.primary.dark, fontWeight: 700 }}
        >
          {title}
        </Typography>
      )}
      {description && (
        <Typography color="text.secondary" variant="body2">
          {description}
        </Typography>
      )}
    </Stack>
  )

  return (
    <motion.div variants={thumbnailVariants}>
      <Stack component="section" sx={{ gap: 0.75 }} {...props}>
        {list ? (
          <>
            {heading && <Stack sx={{ px: 2, pt: 1.5 }}>{heading}</Stack>}
            {hasContent && (
              <List disablePadding sx={heading ? { '& > :first-of-type': { pt: 0.5 } } : undefined}>
                {children}
              </List>
            )}
          </>
        ) : (
          <>
            {heading && <Stack sx={{ px: 2, pt: 1.5 }}>{heading}</Stack>}
            {hasContent && <Stack sx={heading ? { px: 2, pt: 0.5, pb: 2 } : { p: 2 }}>{children}</Stack>}
          </>
        )}
      </Stack>
    </motion.div>
  )
}

interface SettingsRowProps extends Omit<ListItemProps, 'children'> {
  title: string
  description?: string
  control?: ReactNode
}

export function SettingsRow({ title, description, control, sx, ...props }: SettingsRowProps) {
  return (
    <ListItem
      disableGutters
      sx={[
        {
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          px: 2,
          py: 1.5,
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      <Stack sx={{ flex: 1, minWidth: 0, gap: 0.25 }}>
        <Typography variant="body1">{title}</Typography>
        {description && (
          <Typography color="text.secondary" variant="body2">
            {description}
          </Typography>
        )}
      </Stack>
      {control && (
        <Box sx={{ flexShrink: 0, ml: { xs: 'auto', sm: 0 }, '& .MuiFormControl-root': { mb: 0 } }}>{control}</Box>
      )}
    </ListItem>
  )
}
