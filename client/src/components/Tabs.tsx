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
import {
  Box,
  type BoxProps,
  Tab as MuiTab,
  type TabProps as MuiTabProps,
  Tabs as MuiTabs,
  type TabsProps as MuiTabsProps,
  type Theme,
} from '@mui/material'
import { styled } from '@mui/material/styles'

type TabProps = MuiTabProps & {
  theme?: Theme
}

export const Tab = styled(MuiTab)<TabProps>(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  ...theme.typography.body1,
  color: theme.palette.text.secondary,
  textTransform: 'none',
  minWidth: 0,
  padding: '9px 16px',
  '&:hover': {
    color: theme.palette.text.primary,
  },
  '&.Mui-selected': {
    color: theme.palette.primary.dark,
    fontWeight: 600,
  },
}))

export interface TabPanelProps extends BoxProps {
  index: number
  value: number
  children?: React.ReactNode
}

export const TabPanel = ({ index, value, children, ...props }: TabPanelProps) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ width: '100%' }} {...props}>
    {value === index && children}
  </Box>
)

export type TabsProps = MuiTabsProps

export const Tabs = MuiTabs
