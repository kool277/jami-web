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
  ListItemText,
  ListItemTextProps,
  MenuItem,
  MenuItemProps,
  MenuList,
  MenuListProps,
  MenuProps,
  Stack,
  styled,
  SvgIconProps,
} from '@mui/material'
import { ComponentType } from 'react'

export type PopoverListItemData = {
  label: string
  Icon: ComponentType<SvgIconProps>
  iconColor?: string
  iconSize?: string
  onClick: () => void
}

interface ListIconProps extends SvgIconProps {
  Icon: ComponentType<SvgIconProps>
  iconColor?: string
  iconSize?: string
}

const ListIcon = styled(({ Icon, iconColor, iconSize, ...props }: ListIconProps) => <Icon {...props} />)(
  ({ iconColor, iconSize = '16px', theme }) => ({
    height: iconSize,
    fontSize: iconSize,
    color: iconColor ?? theme?.palette?.primary?.dark,
  }),
)

interface ListLabelProps extends ListItemTextProps {
  label: string
}

const ListLabel = styled(({ label, ...props }: ListLabelProps) => (
  <ListItemText
    {...props}
    primary={label}
    slotProps={{
      primary: {
        variant: 'caption',
      },
    }}
  />
))(() => ({
  height: '16px',
}))

interface PopoverListItemProps extends MenuItemProps {
  item: PopoverListItemData
  closeMenu?: MenuProps['onClose']
}

const PopoverListItem = styled(({ item, closeMenu, ...props }: PopoverListItemProps) => (
  <MenuItem
    {...props}
    onClick={() => {
      item.onClick()
      closeMenu?.({}, 'backdropClick')
    }}
    sx={{
      paddingY: '11px',
      paddingX: '16px',
    }}
  >
    <Stack direction="row" spacing="10px" sx={{ alignItems: 'center' }}>
      <ListIcon Icon={item.Icon} iconColor={item.iconColor} iconSize={item.iconSize} />
      <ListLabel label={item.label} />
    </Stack>
  </MenuItem>
))(() => ({
  // Failed to modify the styles from here
}))

interface PopoverListProps extends MenuListProps {
  items: PopoverListItemData[]
  onClose?: MenuProps['onClose']
}

// A list intended to be used as a menu into a popover
const PopoverList = styled(({ items, onClose, ...props }: PopoverListProps) => (
  <MenuList {...props}>
    {items.map((item) => (
      <PopoverListItem key={item.label} item={item} closeMenu={onClose} />
    ))}
  </MenuList>
))(() => ({
  padding: '3px 0px',
}))

export default PopoverList
