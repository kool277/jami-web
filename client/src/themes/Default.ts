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
import { createTheme, PaletteMode, SimplePaletteColorOptions } from '@mui/material'
import { Theme as EmojiTheme } from 'emoji-picker-react'

declare module '@mui/material/styles' {
  interface Theme {
    InfoTooltip: {
      backgroundColor: SimplePaletteColorOptions
      color: SimplePaletteColorOptions
    }
    ChatInterface: {
      panelColor: string
      inputColor: string
    }
    LoginPage: {
      backgroundColor: string
    }
    Header: {
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
  }

  interface ThemeOptions {
    InfoTooltip: {
      backgroundColor: SimplePaletteColorOptions
      color: SimplePaletteColorOptions
    }
  }
}

const _fonts = {
  typography: {
    fontFamily: 'Ubuntu',
    allVariants: {
      color: 'black',
    },
    h1: {
      fontWeight: 400,
      fontSize: '26px',
      lineHeight: '36px',
    },
    h2: {
      fontWeight: 400,
      fontSize: '22px',
      lineHeight: '30px',
    },
    h3: {
      fontWeight: 400,
      fontSize: '18px',
      lineHeight: '26px',
    },
    h4: {
      fontWeight: 500,
      fontSize: '15px',
      lineHeight: '22px',
    },
    h5: {
      fontWeight: 500,
      fontSize: '13px',
      lineHeight: '19px',
    },
    body1: {
      fontWeight: 400,
      fontSize: '15px',
      lineHeight: '22px',
    },
    body2: {
      fontWeight: 400,
      fontSize: '13px',
      lineHeight: '19px',
    },
    caption: {
      fontWeight: 400,
      fontSize: '12px',
      lineHeight: '16px',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: "Ubuntu";
          src: url("./fonts/Ubuntu-Th.ttf");
          font-weight: 100;
          font-style: normal;
        }
        @font-face {
          font-family: "Ubuntu";
          src: url("./fonts/Ubuntu-L.ttf");
          font-weight: 300;
          font-style: normal;
        }
        @font-face {
          font-family: "Ubuntu";
          src: url("./fonts/Ubuntu-LI.ttf");
          font-weight: 300;
          font-style: italic;
        }
        @font-face {
          font-family: "Ubuntu";
          src: url("./fonts/Ubuntu-R.ttf");
          font-weight: 400;
          font-style: normal;
        }
        @font-face {
          font-family: "Ubuntu";
          src: url("./fonts/Ubuntu-RI.ttf");
          font-weight: 400;
          font-style: italic;
        }
        @font-face {
          font-family: "Ubuntu";
          src: url("./fonts/Ubuntu-M.ttf");
          font-weight: 500;
          font-style: normal;
        }
        @font-face {
          font-family: "Ubuntu";
          src: url("./fonts/Ubuntu-MI.ttf");
          font-weight: 500;
          font-style: italic;
        }
        @font-face {
          font-family: "Ubuntu";
          src: url("./fonts/Ubuntu-B.ttf");
          font-weight: 700;
          font-style: normal;
        }
        @font-face {
          font-family: "Ubuntu";
          src: url("./fonts/Ubuntu-BI.ttf");
          font-weight: 700;
          font-style: italic;
        }
      `,
    },
  },
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
      panelColor: '#f2f2f2',
      inputColor: 'black',
    },
    LoginPage: {
      backgroundColor: '#f9fafc',
    },
    Header: {
      backgroundColor: '#dbd9d9',
      iconsColor: 'black',
    },
    EmojiPicker: {
      backgroundColor: EmojiTheme.LIGHT,
    },
    CustomSelect: {
      backgroundColor: 'white',
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
    },
    LoginPage: {
      backgroundColor: '#f9fafc',
    },
    Header: {
      backgroundColor: '#2e2d2d',
      iconsColor: 'white',
    },
    EmojiPicker: {
      backgroundColor: EmojiTheme.DARK,
    },
    CustomSelect: {
      backgroundColor: '#121212',
    },
  },
}

export const buildDefaultTheme = (mode: PaletteMode) => {
  //return createTheme({ ...palettes[mode] /*, ...fonts*/ })
  // Attemps to set the fonts on the second "createTheme" has resulted with wrong font-families
  const partialTheme = createTheme({ ...palettes[mode] /*, ...fonts*/ })
  const palette = partialTheme.palette
  const ChatInterface = partialTheme.ChatInterface

  return createTheme(partialTheme, {
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            height: '46px',
            fontWeight: 700,
            fontSize: '15px',
            lineHeight: '17px',
            textTransform: 'none',
            borderRadius: '5px',
          },
          sizeSmall: {
            height: '36px',
          },
          contained: {
            background: palette.primary.dark,
            '&:hover': {
              background: palette.primary.main,
            },
          },
          outlined: {
            background: '#FFF',
            borderColor: '#0056995C',
            color: palette.primary.dark,
            '&:hover': {
              background: palette.primary.light,
              borderColor: palette.primary.dark,
            },
          },
          text: {
            background: '#fff',
            color: palette.primary.dark,
            '&:hover': {
              background: palette.primary.light,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            padding: '16px',
            boxShadow: '3px 3px 7px #00000029',
            borderRadius: '20px',
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
            width: '60px',
            height: '30px',
            padding: 0,
          },
          switchBase: {
            padding: 0,
            '&.Mui-checked': {
              transform: `translateX(30px)`,
            },
          },
          thumb: {
            boxSizing: 'border-box',
            width: '30px',
            height: '30px',
            border: `1px solid ${palette.primary.dark}`,
            boxShadow: 'none',
            '.Mui-checked.Mui-checked &': {
              border: 'none',
            },
          },
          track: {
            backgroundColor: palette.primary.light,
            borderRadius: '30px',
            opacity: 1,
            '.Mui-checked.Mui-checked + &': {
              backgroundColor: palette.primary.light,
              opacity: 1,
            },
          },
          colorPrimary: {
            color: '#fff',
            '&.Mui-checked': {
              color: palette.primary.dark,
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
      MuiFormControl: {
        styleOverrides: {
          root: {
            height: '90px',
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            position: 'absolute',
            bottom: '0px',
            fontSize: '15px',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: ChatInterface.inputColor,
            fontSize: '15px',
            left: '50%',
            transform: 'translate(-50%, 20px)',
            transition: 'left .2s, transform .2s',
          },
          shrink: {
            color: ChatInterface.inputColor,
            left: 0,
            transform: 'translate(0, 50px) scale(0.75)',
            transition: 'left .2s, transform .2s',
            '&.Mui-focused, &.Mui-error': {
              color: ChatInterface.inputColor,
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: '#005699',
          },
        },
      },
      /*MuiListItemButton: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: '#cccccc',
              opacity: 1,
              '&:hover': {
                backgroundColor: '#cccccc',
                opacity: 1,
              },
            },
            '&:hover': {
              backgroundColor: '#d5d5d5',
              opacity: 1,
            },
          },
        },
      },*/
    },
  })
}
