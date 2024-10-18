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
import { Alert, AlertColor, AlertProps, AlertTitle, Snackbar, SnackbarProps } from '@mui/material'
import { createContext, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SetState, WithChildren } from '../utils/utils'
type AlertSnackbarProps = AlertProps & {
  severity: AlertColor
  open?: boolean
  snackBarProps?: Partial<SnackbarProps>
}

export type AlertContent = {
  messageI18nKey: AlertMessageKeys
  messageI18nContext?: object
  severity: AlertColor
  alertOpen: boolean
}

export function AlertSnackbar({ severity, open, snackBarProps, children, ...alertProps }: AlertSnackbarProps) {
  const { t } = useTranslation()

  return (
    <Snackbar
      open={open}
      {...snackBarProps}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
        ...snackBarProps?.anchorOrigin,
      }}
    >
      <Alert severity={severity} {...alertProps}>
        <AlertTitle>{t('severity', { context: `${severity}` })}</AlertTitle>
        {children}
      </Alert>
    </Snackbar>
  )
}

type IAlertSnackbarContext = {
  alertContent: AlertContent
  setAlertContent: SetState<AlertContent>
  closeAlert: () => void
}

const defaultAlertSnackbarContext: IAlertSnackbarContext = {
  alertContent: {
    messageI18nKey: '',
    messageI18nContext: {},
    severity: 'info',
    alertOpen: false,
  },
  setAlertContent: () => {},
  closeAlert: () => {},
}

//Don't forget to add the cases in the switch statement below
type AlertMessageKeys =
  | 'redirect_admin_setup_complete'
  | 'password_input_helper_text_not_match'
  | 'admin_page_setup_not_complete'
  | 'admin_page_setup_complete'
  | 'missed_incoming_call'
  | 'unknown_error_alert'
  | 'username_input_helper_text_empty'
  | 'password_input_helper_text_empty'
  | 'login_invalid_credentials'
  | 'registration_success'
  | ''
  | 'setting_name_server_error'
  | 'getting_name_server_error'
  | 'unauthorized_access'

export const AlertSnackbarContext = createContext<IAlertSnackbarContext>(defaultAlertSnackbarContext)

const AlertSnackbarProvider = ({ children }: WithChildren) => {
  const { t } = useTranslation()
  const [alertContent, setAlertContent] = useState<AlertContent>(defaultAlertSnackbarContext.alertContent)
  const closeAlert = () => {
    setAlertContent((prev) => {
      return {
        ...prev,
        alertOpen: false,
      }
    })
  }

  //This is to explicitly let i18n know that these keys should be extracted
  const getAlertMessageText = useCallback(
    (messageI18nKey: AlertMessageKeys, messageI18nContext?: object): string => {
      switch (messageI18nKey) {
        case 'missed_incoming_call':
          return t('missed_incoming_call', { ...messageI18nContext })
        case 'unknown_error_alert':
          return t('unknown_error_alert')
        case 'username_input_helper_text_empty':
          return t('username_input_helper_text_empty')
        case 'password_input_helper_text_empty':
          return t('password_input_helper_text_empty')
        case 'login_invalid_credentials':
          return t('login_invalid_credentials')
        case 'registration_success':
          return t('registration_success')
        case 'redirect_admin_setup_complete':
          return t('redirect_admin_setup_complete')
        case 'password_input_helper_text_not_match':
          return t('password_input_helper_text_not_match')
        case 'admin_page_setup_not_complete':
          return t('admin_page_setup_not_complete')
        case 'admin_page_setup_complete':
          return t('admin_page_setup_complete')
        case 'setting_name_server_error':
          return t('setting_name_server_error')
        case 'getting_name_server_error':
          return t('getting_name_server_error')
        case 'unauthorized_access':
          return t('unauthorized_access')
        default:
          return t('unknown_error_alert')
      }
    },
    [t],
  )

  const value = {
    alertContent,
    setAlertContent,
    closeAlert,
  }

  return (
    <>
      <AlertSnackbar severity={alertContent.severity} open={alertContent.alertOpen} onClose={closeAlert}>
        {getAlertMessageText(alertContent.messageI18nKey, alertContent.messageI18nContext)}
      </AlertSnackbar>
      <AlertSnackbarContext.Provider value={value}>{children}</AlertSnackbarContext.Provider>
    </>
  )
}

export default AlertSnackbarProvider
