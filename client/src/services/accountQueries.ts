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
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { removedLinkedDeviceContent } from 'jami-web-common'
import { useContext } from 'react'

import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider'
import { useAuthContext } from '../contexts/AuthProvider'
import { apiUrl } from '../utils/constants'

export const useRemoveLinkedDevice = () => {
  const { axiosInstance } = useAuthContext()
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const token = localStorage.getItem('accessToken')

  return useMutation({
    mutationFn: async (content: removedLinkedDeviceContent) => {
      const { data } = await axiosInstance.post(`/account/${content.deviceId}/revoke/`, {
        baseURL: apiUrl,
        headers: { Authorization: `Bearer ${token}` },
      })
      return data
    },

    onSuccess: () => {
      setAlertContent({
        messageI18nKey: 'removed_linked_device_success',
        severity: 'success',
        alertOpen: true,
      })
    },

    onError: () => {
      setAlertContent({
        messageI18nKey: 'removed_linked_device_error',
        severity: 'error',
        alertOpen: true,
      })
    },
  })
}

export const useSetDisplayName = () => {
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const token = localStorage.getItem('accessToken')
  return useMutation({
    mutationKey: ['set', 'displayName'],
    mutationFn: async (displayName: string) => {
      const { data } = await axios.post(
        `/account/displayName`,
        { displayName },
        {
          baseURL: apiUrl,
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      return data
    },
    onSuccess: () => {
      setAlertContent({
        messageI18nKey: 'setting_display_name_success_alert',
        severity: 'success',
        alertOpen: true,
      })
    },
    onError: () => {
      setAlertContent({
        messageI18nKey: 'setting_display_name_error_alert',
        severity: 'error',
        alertOpen: true,
      })
    },
  })
}

export const useResetDisplayName = () => {
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const token = localStorage.getItem('accessToken')
  return useMutation({
    mutationKey: ['reset', 'displayName'],
    mutationFn: async () => {
      const { data } = await axios.post(`/account/displayName/reset`, {
        baseURL: apiUrl,
        headers: { Authorization: `Bearer ${token}` },
      })
      return data
    },
    onSuccess: () => {
      setAlertContent({
        messageI18nKey: 'resetting_display_name_success_alert',
        severity: 'success',
        alertOpen: true,
      })
    },
    onError: () => {
      setAlertContent({
        messageI18nKey: 'resetting_display_name_error_alert',
        severity: 'error',
        alertOpen: true,
      })
    },
  })
}
