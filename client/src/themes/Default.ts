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
import { createTheme, Direction, PaletteMode, SimplePaletteColorOptions } from '@mui/material'
import { TypographyVariantsOptions } from '@mui/material/styles'
import { type Theme as EmojiTheme } from 'emoji-picker-react'

const lightEmojiTheme = 'light' as EmojiTheme
const darkEmojiTheme = 'dark' as EmojiTheme

declare module '@mui/material/styles' {
  interface Theme {
    InfoTooltip: {
      backgroundColor: SimplePaletteColorOptions
      color: SimplePaletteColorOptions
    }
    ChatInterface: {
      panelColor: string
      inputColor: string
      messageColor: string
      fontColor: string
      replyBorderColor: string
      messageReplyColor: string
      reactionModalBackground: string
      selectedColor: string
      backgroundColor: string
    }
    LoginPage: {
      backgroundColor: string
    }
    Dialog: {
      backgroundColor: string
    }
    WelcomePage: {
      infoBackgroundColor: string
      tipsBackgroundColor: string
      tipsHoverBackgroundColor: string
      middleBoxBackgroundColor: string
      iconsColor: string
    }
    MediaViewer: {
      backgroundColor: string
      fileBackgroundColor: string
    }
    MessageCall: {
      textColorMissed: string
    }
    MessageDataContent: {
      textColor: string
      backgroundColor: string
      textContentColor: string
    }
    Footer: {
      backgroundColor: string
      iconsColor: string
    }
    EmojiPicker: {
      backgroundColor: EmojiTheme
    }
    CustomSelect: {
      backgroundColor: string
      hoverColor: string
    }
    Panel: {
      outerBackground: string
      borderRadius: string
      padding: string
      shadow: string
      itemBorderRadius: string
      itemPadding: string
    }
    ConversationPreferences: {
      backgroundColor: string
      border: string
    }
    SvgIcons: {
      color: string
      hoverBackgroundColor: string
    }
    Buttons: {
      hoverBackgroundColor: string
      color: string
      disabledColor: string
    }
    BaseButton: {
      interaction: {
        hoverBackgroundColor: string
        activeBackgroundColor: string
        foregroundColor: string
      }
      contained: {
        color: string
        backgroundColor: string
      }
      outlined: {
        color: string
        backgroundColor: string
        borderColor: string
      }
      text: {
        color: string
        backgroundColor: string
      }
    }
    SettingsBackButton: {
      hoverBackgroundColor: string
      backgroundColor: string
    }
    StatusIcon: {
      color: string
      border: string
    }
    TranferMessage: {
      inputColor: string
      fontColor: string
      titleColor: string
    }
    SettingsNeedPassword: {
      backgroundColor: string
    }
  }

  interface ThemeOptions {
    InfoTooltip: {
      backgroundColor: SimplePaletteColorOptions
      color: SimplePaletteColorOptions
    }
    Dialog: {
      backgroundColor: string
    }
  }
}

const palettes = {
  light: {
    palette: {
      mode: 'light' as PaletteMode,
      primary: {
        light: '#E5EEF5', // same as "#0056991A"
        main: '#0071C9',
        dark: '#005699',
      },
      error: {
        main: '#CC0022',
        dark: '#720013',
      },
      success: {
        main: '#009980',
      },
      secondary: {
        main: '#A3C2DA',
        dark: '#06493F',
      },
      action: {
        disabled: '#7F7F7F',
      },
    },
    InfoTooltip: {
      backgroundColor: {
        main: '#FFFFFF',
      },
      color: {
        main: '#292929',
      },
    },
    ChatInterface: {
      panelColor: '#FAF6F0',
      inputColor: 'black',
      messageColor: '#F0EBE3',
      fontColor: 'black',
      replyBorderColor: '2px solid white',
      messageReplyColor: '#E8E2D9',
      reactionModalBackground: '#F0EBE3',
      selectedColor: '#EDE7DD',
      backgroundColor: '#FEFCF9',
    },
    LoginPage: {
      backgroundColor: '#FAF6F0',
    },
    Dialog: {
      backgroundColor: '#f4f0ef',
    },
    WelcomePage: {
      infoBackgroundColor: '#f0efef',
      tipsBackgroundColor: 'rgba(255, 255, 255, 0.3)',
      tipsHoverBackgroundColor: 'rgba(255, 255, 255, 0.6)',
      middleBoxBackgroundColor: 'rgba(255, 255, 255, 0.5)',
      iconsColor: '#005699',
    },
    MediaViewer: {
      backgroundColor: 'white',
      fileBackgroundColor: 'lightgrey',
    },
    MessageCall: {
      textColorMissed: '#CC0022',
    },
    MessageDataContent: {
      textColor: 'black',
      backgroundColor: '#7f7f7f',
      textContentColor: '#555555',
    },
    Footer: {
      backgroundColor: '#F0EBE3',
      iconsColor: '#333333',
    },
    EmojiPicker: {
      backgroundColor: lightEmojiTheme,
    },
    CustomSelect: {
      backgroundColor: 'white',
    },
    ConversationPreferences: {
      backgroundColor: '#FAF6F0',
      border: '0.5px #E0D9CF solid',
    },
    Panel: {
      outerBackground: '#E8E2D8',
      borderRadius: '32px',
      padding: '8px',
      shadow: '0 2px 16px rgba(0, 0, 0, 0.06)',
      itemBorderRadius: '24px',
      itemPadding: '4px',
    },
    SvgIcons: {
      color: '#0071C9',
      hoverBackgroundColor: '#F0EBE3',
    },
    Buttons: {
      hoverBackgroundColor: '#E5EEF5',
      color: '#4f4f4f',
      disabledColor: '#7e7e7e',
    },
    BaseButton: {
      interaction: {
        hoverBackgroundColor: '#005699EB',
        activeBackgroundColor: '#005699CC',
        foregroundColor: '#FFFFFF',
      },
      contained: {
        color: '#FFFFFF',
        backgroundColor: '#005699',
      },
      outlined: {
        color: '#005699',
        backgroundColor: 'transparent',
        borderColor: '#005699',
      },
      text: {
        color: '#000000',
        backgroundColor: 'transparent',
      },
    },
    StatusIcon: {
      color: 'black',
      border: '4px solid white',
    },
    SettingsBackButton: {
      hoverBackgroundColor: '#F0EBE3',
      backgroundColor: '#FEFCF9',
    },
    TranferMessage: {
      InputColor: 'white',
      fontColor: 'black',
      titleColor: 'black',
    },
    SettingsNeedPassword: {
      backgroundColor: '#FAF6F0',
    },
  },
  dark: {
    palette: {
      mode: 'dark' as PaletteMode,
      primary: {
        light: '#E5EEF5', // same as "#0056991A"
        main: '#0071C9',
        dark: '#005699',
      },
      error: {
        main: '#CC0022',
        dark: '#720013',
      },
      success: {
        main: '#009980',
      },
      secondary: {
        main: '#A3C2DA',
        dark: '#06493F',
      },
      action: {
        disabled: '#7F7F7F',
      },
    },
    InfoTooltip: {
      backgroundColor: {
        main: '#2f2f2f',
      },
      color: {
        main: '#f5f5f5',
      },
    },
    ChatInterface: {
      panelColor: '#181818',
      inputColor: 'white',
      messageColor: '#6C6C6C',
      fontColor: 'white',
      replyBorderColor: '3px solid #121212',
      messageReplyColor: '#404040',
      reactionModalBackground: '#1e1f1e',
      selectedColor: '#122D42',
      backgroundColor: '#050505',
    },
    LoginPage: {
      backgroundColor: '#f9fafc',
    },
    Dialog: {
      backgroundColor: 'rgb(24, 24, 24)',
    },
    WelcomePage: {
      infoBackgroundColor: '#333333',
      tipsBackgroundColor: 'rgba(0, 0, 0, 0.8)',
      tipsHoverBackgroundColor: 'rgba(0, 0, 0, 0.5)',
      middleBoxBackgroundColor: 'rgba(0, 0, 0, 0.8)',
      iconsColor: 'white',
    },
    MediaViewer: {
      backgroundColor: '#181818',
      fileBackgroundColor: '#393838',
    },
    MessageCall: {
      textColorMissed: '#FA2E30',
    },
    MessageDataContent: {
      textColor: 'white',
      backgroundColor: '#7f7f7f',
      textContentColor: '#adacac',
    },
    Footer: {
      backgroundColor: '#2e2d2d',
      iconsColor: 'white',
    },
    EmojiPicker: {
      backgroundColor: darkEmojiTheme,
    },
    CustomSelect: {
      backgroundColor: '#121212',
    },
    ConversationPreferences: {
      backgroundColor: '#181818',
      border: '0.5px darkgrey solid',
    },
    Panel: {
      outerBackground: '#0A0A0A',
      borderRadius: '32px',
      padding: '8px',
      shadow: '0 2px 16px rgba(0, 0, 0, 0.25)',
      itemBorderRadius: '24px',
      itemPadding: '4px',
    },
    SvgIcons: {
      color: 'white',
      hoverBackgroundColor: '#2A2A2A',
    },
    Buttons: {
      hoverBackgroundColor: '#262525',
      color: '#EAEAEA',
      disabledColor: '#7E7E7E',
    },
    BaseButton: {
      interaction: {
        hoverBackgroundColor: '#03B9E9EB',
        activeBackgroundColor: '#03B9E9CC',
        foregroundColor: '#000000',
      },
      contained: {
        color: '#000000',
        backgroundColor: '#03B9E9',
      },
      outlined: {
        color: '#03B9E9',
        backgroundColor: 'transparent',
        borderColor: '#03B9E9',
      },
      text: {
        color: '#FFFFFF',
        backgroundColor: 'transparent',
      },
    },
    StatusIcon: {
      color: 'white',
      border: '4px solid #121212',
    },
    SettingsBackButton: {
      hoverBackgroundColor: '#E5E5E5',
      backgroundColor: 'white',
    },
    TranferMessage: {
      inputColor: '#585858',
      fontColor: 'lightgrey',
      titleColor: 'white',
    },
    SettingsNeedPassword: {
      backgroundColor: '#393838',
    },
  },
}

const typography: TypographyVariantsOptions = {
  fontFamily: '"Ubuntu", "Helvetica", "Arial", sans-serif',
  // Sizes are expressed in rem and line heights are unitless so the scale follows the
  // reader's browser font size instead of overriding it.
  h1: { fontWeight: 400, fontSize: '1.625rem', lineHeight: 1.38 },
  h2: { fontWeight: 400, fontSize: '1.375rem', lineHeight: 1.36 },
  h3: { fontWeight: 400, fontSize: '1.125rem', lineHeight: 1.44 },
  h4: { fontWeight: 500, fontSize: '0.9375rem', lineHeight: 1.47 },
  h5: { fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1.46 },
  body1: { fontWeight: 400, fontSize: '0.9375rem', lineHeight: 1.47 },
  body2: { fontWeight: 400, fontSize: '0.8125rem', lineHeight: 1.46 },
  caption: { fontWeight: 400, fontSize: '0.75rem', lineHeight: 1.33 },
  button: { fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.13, textTransform: 'none' },
}

export const buildDefaultTheme = (mode: PaletteMode, direction: Direction) => {
  // Typography must be declared in the first `createTheme` call: MUI resolves `fontFamily` into
  // each variant at creation time, so a later merge would leave every variant on the default font.
  const partialTheme = createTheme({ ...palettes[mode], direction, typography })
  const palette = partialTheme.palette
  const ChatInterface = partialTheme.ChatInterface
  const BaseButton = partialTheme.BaseButton
  const Panel = partialTheme.Panel
  const isDark = mode === 'dark'

  // Unified shadow system
  const shadows = {
    subtle: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
    low: isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)',
    medium: isDark ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.10)',
    high: isDark ? '0 8px 40px rgba(0,0,0,0.6)' : '0 8px 40px rgba(0,0,0,0.12)',
    float: isDark
      ? '0 2px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)'
      : '0 2px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)',
  }

  return createTheme(partialTheme, {
    shape: {
      borderRadius: 20,
    },
    shadows: (() => {
      const s = [...Array(25)].map(() => 'none') as string[]
      s[1] = shadows.subtle
      s[2] = shadows.low
      s[3] = shadows.medium
      s[4] = shadows.high
      s[8] = shadows.float
      return s
    })(),
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            height: '35px',
            borderRadius: '9999px',
            transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease',
            '&.Mui-focusVisible': {
              outline: '2px solid currentColor',
              outlineOffset: '2px',
            },
            '@media (prefers-reduced-motion: reduce)': {
              transition: 'none',
            },
            // Text buttons need contained-equivalent padding because they do not have an outlined border.
            '&.MuiButton-text': {
              padding: '6px 16px',
            },
            '&.MuiButton-text.MuiButton-sizeSmall': {
              padding: '4px 10px',
            },
            '&.MuiButton-text.MuiButton-sizeLarge': {
              padding: '8px 22px',
            },
          },
          sizeSmall: {
            height: '26px',
          },
          contained: {
            color: BaseButton.contained.color,
            background: BaseButton.contained.backgroundColor,
            '&:hover': {
              background: BaseButton.interaction.hoverBackgroundColor,
            },
            '&:active': {
              background: BaseButton.interaction.activeBackgroundColor,
            },
          },
          outlined: {
            background: BaseButton.outlined.backgroundColor,
            borderColor: BaseButton.outlined.borderColor,
            color: BaseButton.outlined.color,
            '&:hover': {
              background: BaseButton.interaction.hoverBackgroundColor,
              borderColor: BaseButton.interaction.hoverBackgroundColor,
              color: BaseButton.interaction.foregroundColor,
            },
            '&:active': {
              background: BaseButton.interaction.activeBackgroundColor,
              borderColor: BaseButton.interaction.activeBackgroundColor,
              color: BaseButton.interaction.foregroundColor,
            },
          },
          text: {
            background: BaseButton.text.backgroundColor,
            color: BaseButton.text.color,
            '&:hover': {
              background: BaseButton.interaction.hoverBackgroundColor,
              color: BaseButton.interaction.foregroundColor,
            },
            '&:active': {
              background: BaseButton.interaction.activeBackgroundColor,
              color: BaseButton.interaction.foregroundColor,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: Panel.itemBorderRadius,
            boxShadow: shadows.low,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: Panel.itemBorderRadius,
          },
          elevation1: { boxShadow: shadows.subtle },
          elevation2: { boxShadow: shadows.low },
          elevation3: { boxShadow: shadows.medium },
          elevation4: { boxShadow: shadows.high },
          elevation8: { boxShadow: shadows.float },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            padding: '16px',
            boxShadow: shadows.high,
            borderRadius: '24px',
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '0px',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: '0px',
            margin: '16px 0px',
            minWidth: '500px',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            padding: '0px',
          },
        },
      },
      MuiSwitch: {
        defaultProps: {
          disableRipple: true,
        },
        styleOverrides: {
          root: {
            width: '55px',
            height: '28px',
            padding: 0,
          },
          switchBase: {
            border: 'none',
            marginTop: '2px',
            marginLeft: '2px',
            padding: 0,
            '&.Mui-checked': {
              marginLeft: '-1px',
              transform: `translateX(30px)`,
            },
          },
          thumb: {
            boxSizing: 'border-box',
            width: '24px',
            height: '24px',
            boxShadow: 'none',
            '.Mui-checked.Mui-checked &': {
              border: 'none',
            },
          },
          track: {
            backgroundColor: '#c2cad1',
            borderRadius: '25px',
            opacity: 1,
            '.Mui-checked.Mui-checked + &': {
              backgroundColor: palette.primary.dark,
              opacity: 1,
            },
          },
          colorPrimary: {
            color: 'white',
            '&.Mui-checked': {
              color: 'white',
            },
          },
        },
      },
      MuiInput: {
        styleOverrides: {
          root: {
            color: ChatInterface.inputColor,
            '&.Mui-error': {
              color: palette.error.main,
            },
          },
          underline: {
            '&:before': {
              borderBottom: `2px solid ${palette.primary.dark}`,
            },
            '&:hover:not(.Mui-disabled, .Mui-error):before': {
              borderBottom: '2px solid #03B9E9',
            },
            '&:after': {
              borderBottom: '2px solid #03B9E9',
            },
            '&:hover:not(.Mui-error):after': {
              borderBottom: '2px solid #03B9E9',
            },
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            marginBottom: '12px',
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            textAlign: 'center',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: ChatInterface.inputColor,
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: palette.primary.dark,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: '50%',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '9999px',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: '9999px',
            '&.Mui-selected': {
              backgroundColor: ChatInterface.selectedColor,
              '&:hover': {
                backgroundColor: ChatInterface.selectedColor,
              },
            },
            '&:hover': {
              backgroundColor: `${ChatInterface.selectedColor}80`,
            },
          },
        },
      },
    },
  })
}
