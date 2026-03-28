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
import { Tab as MuiTab, TabProps as MuiTabProps, Tabs as MuiTabs, TabsProps as MuiTabsProps } from '@mui/material'
import { type BoxProps, Theme } from '@mui/material'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

type TabProps = MuiTabProps & {
  theme?: Theme
  isSelected?: boolean
}

export const Tab = styled(MuiTab)<TabProps>(({ theme, isSelected }) => ({
  fontFamily: theme.typography.fontFamily,
  ...theme.typography.body1,
  color: isSelected ? 'black' : '#666666',
  cursor: 'pointer',
  border: 'none',
  display: 'flex',
  justifyContent: 'center',
  borderBottom: isSelected ? '2px solid grey' : 'none',
  backgroundColor: 'inherit',
  padding: '9px 0',
  '&:hover': {
    color: 'black',
    borderColor: theme.palette.primary.light,
    // Attempt to change boldess while keeping same container size
    // https://stackoverflow.com/a/14978871
    textShadow: '0 0 .01px black',
  },
  '&.Mui-selected': {
    color: theme.palette.primary.dark,
    borderColor: theme.palette.primary.dark,
    // https://stackoverflow.com/a/14978871
    textShadow: `0 0 .01px ${theme.palette.primary.dark}`,
  },
  '&:before': {
    display: 'block',
    content: 'attr(content)',
    fontWeight: 'bold',
    height: '15px',
    color: 'transparent',
    overflow: 'hidden',
    visibility: 'hidden',
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

export const TabsList = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  placeContent: 'space-evenly',
}))

export type TabsProps = MuiTabsProps

export const Tabs = MuiTabs
