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
import { Box, Divider, List, ListItem, type ListItemProps, Stack, type StackProps, Typography } from '@mui/material'
import { type ReactNode } from 'react'

interface SettingsPageProps {
  title: string
  description?: string
  children: ReactNode
}

export function SettingsPage({ title, description, children }: SettingsPageProps) {
  return (
    <Box component="article" sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <Stack sx={{ width: '100%', maxWidth: 720, mx: 'auto', p: { xs: 2, sm: 3 }, gap: 4 }}>
        <Stack sx={{ gap: 0.5 }}>
          <Typography component="h1" variant="h2">
            {title}
          </Typography>
          {description && (
            <Typography color="text.secondary" variant="body2">
              {description}
            </Typography>
          )}
        </Stack>
        {children}
      </Stack>
    </Box>
  )
}

interface SettingsSectionProps extends StackProps {
  title: string
  description?: string
  children: ReactNode
}

export function SettingsSection({ title, description, children, ...props }: SettingsSectionProps) {
  return (
    <Stack component="section" sx={{ gap: 1.5 }} {...props}>
      <Stack sx={{ gap: 0.25 }}>
        <Typography component="h2" variant="h4">
          {title}
        </Typography>
        {description && (
          <Typography color="text.secondary" variant="body2">
            {description}
          </Typography>
        )}
      </Stack>
      <List disablePadding sx={{ borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
        {children}
      </List>
    </Stack>
  )
}

interface SettingsRowProps extends Omit<ListItemProps, 'children'> {
  title: string
  description?: string
  control?: ReactNode
}

export function SettingsRow({ title, description, control, sx, ...props }: SettingsRowProps) {
  return (
    <>
      <ListItem
        sx={[
          {
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            px: 0,
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
        {control && <Box sx={{ flexShrink: 0, ml: { xs: 'auto', sm: 0 } }}>{control}</Box>}
      </ListItem>
      <Divider component="li" />
    </>
  )
}
