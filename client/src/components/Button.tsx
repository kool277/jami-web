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
  ClickAwayListener,
  FormControlLabel,
  IconButton,
  IconButtonProps,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popper,
  Radio,
  RadioGroup,
  RadioGroupProps,
  SvgIconProps,
  Theme,
} from '@mui/material'
import { PaletteColor, styled, useTheme } from '@mui/material/styles'
import { type Instance as PopperInstance } from '@popperjs/core'
import {
  ComponentProps,
  ComponentType,
  lazy,
  ReactNode,
  Suspense,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import { type EmojiClickData } from '../utils/emojiPicker.js'
import BaseIconButton from './common/BaseIconButton.js'
import { CrossedEyeIcon, EmojiIcon, ExpandLessIcon, EyeIcon, InfoIcon, SaltireIcon } from './SvgIcon.js'
import CustomTooltip from './Tooltip.js'

const EmojiPicker = lazy(() => import('../utils/emojiPicker.js').then((module) => ({ default: module.EmojiPicker })))

type PositionedEmojiPickerProps = ComponentProps<typeof EmojiPicker> & {
  onMount: () => void
}

const PositionedEmojiPicker = ({ onMount, ...props }: PositionedEmojiPickerProps) => {
  useLayoutEffect(onMount, [onMount])

  return <EmojiPicker {...props} />
}

export type ShapedButtonProps = IconButtonProps & {
  Icon: ComponentType<SvgIconProps>
  tooltip?: string
}

export const RoundButton = styled(({ Icon, ...props }: ShapedButtonProps) => (
  <IconButton {...props} disableRipple={true}>
    <Icon fontSize="inherit" />
  </IconButton>
))(({ theme }) => ({
  border: `1px solid ${theme.SvgIcons.color}`,
  color: theme.SvgIcons.color,
  fontSize: '15px',
  opacity: 1,
  '&:hover': {
    background: theme.SvgIcons.hoverBackgroundColor,
  },
  '&:active': {
    color: '#FFF',
    background: theme.palette.primary.dark,
  },
  '&.MuiIconButton-sizeSmall': {
    height: '15px',
    width: '15px',
  },
  '&.MuiIconButton-sizeMedium': {
    height: '30px',
    width: '30px',
  },
  '&.MuiIconButton-sizeLarge': {
    height: '53px',
    width: '53px',
  },
}))

type ExpandMenuOption = {
  description: ReactNode
  icon?: ReactNode
}

export type ExpandMenuRadioOption = RadioGroupProps & {
  options: {
    key: string
    description: ReactNode
  }[]
}

export type ExpandableButtonProps = IconButtonProps & {
  isVertical?: boolean
  expandMenuOnClick?: boolean
  Icon?: ComponentType<SvgIconProps>
  expandMenuOptions?: (ExpandMenuOption | ExpandMenuRadioOption)[]
  IconButtonComp?: ComponentType<IconButtonProps>
}

export const ExpandableButton = ({
  isVertical,
  Icon,
  expandMenuOnClick,
  expandMenuOptions = undefined,
  IconButtonComp = IconButton,
  ...props
}: ExpandableButtonProps) => {
  const { t } = useTranslation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      {expandMenuOptions && (
        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: !isVertical ? 'top' : 'center',
            horizontal: !isVertical ? 'center' : 'left',
          }}
          transformOrigin={{
            vertical: !isVertical ? 'bottom' : 'center',
            horizontal: !isVertical ? 'center' : 'right',
          }}
        >
          {expandMenuOptions?.map((option) => {
            if ('options' in option) {
              const { options, ...radioGroupProps } = option
              return (
                <RadioGroup key={options.map((option) => option.key).join(':')} {...radioGroupProps}>
                  {options.map(({ description, key }) => (
                    <MenuItem key={key}>
                      <FormControlLabel
                        value={key}
                        control={<Radio value={key} />}
                        label={<ListItemText>{description}</ListItemText>}
                        sx={{
                          width: '100%',
                        }}
                      />
                    </MenuItem>
                  ))}
                </RadioGroup>
              )
            }

            return (
              <MenuItem key={String(option.description)} onClick={handleClose}>
                <ListItemIcon>{option.icon}</ListItemIcon>
                <ListItemText>{option.description}</ListItemText>
              </MenuItem>
            )
          })}
        </Menu>
      )}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {expandMenuOptions && (
          <IconButton
            aria-label={t('call_expand_options')}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              rotate: !isVertical ? '' : '-90deg',
              position: 'absolute',
              top: !isVertical ? '-55%' : 'auto',
              left: !isVertical ? 'auto' : '-55%',
              zIndex: 1,
            }}
            className={props.className}
          >
            <ExpandLessIcon
              fontSize="small"
              sx={{
                backgroundColor: '#444444',
                borderRadius: '50%',
              }}
            />
          </IconButton>
        )}
        <IconButtonComp
          onClick={
            expandMenuOnClick
              ? (event) => {
                  setAnchorEl(event.currentTarget)
                }
              : undefined
          }
          {...props}
        >
          {Icon && <Icon />}
        </IconButtonComp>
      </Box>
    </>
  )
}

type InfoButtonProps = IconButtonProps & {
  tooltipTitle: string
}
export const InfoButton = ({ tooltipTitle, ...props }: InfoButtonProps) => {
  return (
    <CustomTooltip className="tooltip" title={tooltipTitle}>
      <RoundButton {...props} aria-label="informations" Icon={InfoIcon} size="small" />
    </CustomTooltip>
  )
}

export const CloseButton = styled((props: IconButtonProps) => {
  return (
    <IconButton {...props} disableRipple={true} aria-label="close">
      <SaltireIcon fontSize="inherit" />
    </IconButton>
  )
})(({ theme }) => ({
  color: theme.SvgIcons.color,
  fontSize: '15px',
  height: '30px',
  width: '30px',
  borderRadius: '50%',
  '&:hover': {
    background: theme.SvgIcons.hoverBackgroundColor,
  },
}))

type ToggleVisibilityButtonProps = IconButtonProps & {
  visible: boolean
}
export const ToggleVisibilityButton = styled(({ visible, ...props }: ToggleVisibilityButtonProps) => {
  const Icon = visible ? CrossedEyeIcon : EyeIcon
  return (
    <IconButton {...props} disableRipple={true}>
      <Icon fontSize="inherit" />
    </IconButton>
  )
})(({ theme }) => ({
  color: theme.SvgIcons.color,
  fontSize: '15px',
  height: '15px',
  width: '15px',
  '&:hover': {
    background: theme.SvgIcons.hoverBackgroundColor,
  },
}))

type SelectEmojiButtonProps = {
  onEmojiSelected: (emoji: string) => void
}
export const SelectEmojiButton = ({ onEmojiSelected }: SelectEmojiButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const popperRef = useRef<PopperInstance | null>(null)
  const { t } = useTranslation()
  const handleOpenEmojiPicker = useCallback((e: any) => setAnchorEl(anchorEl ? null : e.currentTarget), [anchorEl])
  const theme = useTheme()
  const handleClose = useCallback(() => setAnchorEl(null), [setAnchorEl])
  const updatePickerPosition = useCallback(() => popperRef.current?.forceUpdate(), [])

  const onEmojiClick = //useCallback(
    (emoji: EmojiClickData, _: MouseEvent) => {
      onEmojiSelected(emoji.emoji)
      handleClose()
    } /*,
    [handleClose, onEmojiSelected]
  )*/

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box>
        <BaseIconButton
          aria-describedby={id}
          aria-label={t('button_select_emoji')}
          tooltip={t('button_select_emoji')}
          sx={{ fontSize: '25px', height: '36px', width: '36px' }}
          onClick={handleOpenEmojiPicker}
        >
          <EmojiIcon fontSize="inherit" />
        </BaseIconButton>
        <Popper sx={{ zIndex: 2 }} id={id} open={open} anchorEl={anchorEl} popperRef={popperRef}>
          <Suspense fallback={null}>
            <PositionedEmojiPicker
              onMount={updatePickerPosition}
              theme={theme.EmojiPicker.backgroundColor}
              onEmojiClick={onEmojiClick}
              autoFocusSearch={false}
              skinTonesDisabled={true}
            />
          </Suspense>
        </Popper>
      </Box>
    </ClickAwayListener>
  )
}

export const ColoredRoundButton = styled(
  ({
    paletteColor,
    Icon,
    ...props
  }: ShapedButtonProps & {
    paletteColor?: PaletteColor | ((theme: Theme) => PaletteColor)
  }) => {
    return (
      <IconButton {...props} disableRipple={true}>
        <Icon fontSize="inherit" />
      </IconButton>
    )
  },
)(({ theme, paletteColor = theme.palette.primary }) => {
  if (typeof paletteColor === 'function') {
    paletteColor = paletteColor(theme)
  }

  return {
    color: paletteColor.contrastText,
    backgroundColor: paletteColor.dark,
    '&:hover': {
      backgroundColor: paletteColor.main,
    },
    '&:disabled': {
      backgroundColor: theme.palette.action.disabled,
    },
  }
})
