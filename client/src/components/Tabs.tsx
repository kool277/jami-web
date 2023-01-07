/*
 * Copyright (C) 2022 Savoir-faire Linux Inc.
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
  TabPanelUnstyled,
  TabPanelUnstyledProps,
  TabsListUnstyled,
  TabsUnstyled,
  TabsUnstyledProps,
  TabUnstyled,
  TabUnstyledProps,
} from '@mui/base';
import { Theme } from '@mui/material/styles';
import { styled } from '@mui/system';

type TabProps = TabUnstyledProps & {
  theme?: Theme;
};

export const Tab = styled(TabUnstyled)<TabProps>(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  ...theme.typography.body1,
  color: '#666666',
  cursor: 'pointer',
  border: 'none',
  display: 'flex',
  justifyContent: 'center',
  borderBottom: '4px solid white',
  backgroundColor: 'white',
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
}));

export type TabPanelProps = TabPanelUnstyledProps;

export const TabPanel = styled(TabPanelUnstyled)(() => ({
  width: '100%',
}));

export const TabsList = styled(TabsListUnstyled)(() => ({
  display: 'flex',
  alignItems: 'center',
  placeContent: 'space-evenly',
  borderBottom: '1px solid #bfbfbf',
}));

export type TabsProps = TabsUnstyledProps;

export const Tabs = TabsUnstyled;
