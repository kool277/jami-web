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
  | 'incorrect_password'
  | 'admin_password_changed_successfully'
  | 'setting_jams_server_error'
  | 'setting_jams_server_error_same_value'
  | ''
  | 'setting_name_server_error'
  | 'getting_name_server_error'
  | 'setting_jams_server_success'
  | 'removing_jams_server_success'
  | 'removing_jams_server_error'
  | 'unauthorized_access'
  | 'setting_display_name_success_alert'
  | 'setting_display_name_error_alert'
  | 'resetting_display_name_success_alert'
  | 'resetting_display_name_error_alert'
  | 'error_cannot_delete_message'
  | 'add_to_group_no_user_selected'
  | 'removed_linked_device_success'
  | 'removed_linked_device_error'
  | 'same_limit_error'
  | 'limit_cannot_be_negative'
  | 'setting_auto_download_limit_success'
  | 'setting_auto_download_limit_error'
  | 'update_conversation_preferences_error'

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
        case 'incorrect_password':
          return t('incorrect_password')
        case 'admin_password_changed_successfully':
          return t('admin_password_changed_successfully')
        case 'setting_jams_server_error':
          return t('setting_jams_server_error')
        case 'setting_name_server_error':
          return t('setting_name_server_error')
        case 'getting_name_server_error':
          return t('getting_name_server_error')
        case 'setting_jams_server_success':
          return t('setting_jams_server_success')
        case 'unauthorized_access':
          return t('unauthorized_access')
        case 'setting_display_name_success_alert':
          return t('setting_display_name_success_alert')
        case 'setting_display_name_error_alert':
          return t('setting_display_name_error_alert')
        case 'resetting_display_name_success_alert':
          return t('resetting_display_name_success_alert')
        case 'resetting_display_name_error_alert':
          return t('resetting_display_name_error_alert')
        case 'error_cannot_delete_message':
          return t('error_cannot_delete_message')
        case 'setting_jams_server_error_same_value':
          return t('setting_jams_server_error_same_value')
        case 'removing_jams_server_success':
          return t('removing_jams_server_success')
        case 'removing_jams_server_error':
          return t('removing_jams_server_error')
        case 'add_to_group_no_user_selected':
          return t('add_to_group_no_user_selected')
        case 'removed_linked_device_success':
          return t('removed_linked_device_success')
        case 'removed_linked_device_error':
          return t('removed_linked_device_error')
        case 'same_limit_error':
          return t('same_limit_error')
        case 'limit_cannot_be_negative':
          return t('limit_cannot_be_negative')
        case 'setting_auto_download_limit_success':
          return t('setting_auto_download_limit_success')
        case 'setting_auto_download_limit_error':
          return t('setting_auto_download_limit_error')
        case 'update_conversation_preferences_error':
          return t('update_conversation_preferences_error')
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
