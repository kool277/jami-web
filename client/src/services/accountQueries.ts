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
import { removedLinkedDeviceContent } from '@savoirfairelinux/jami-web-common'
import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { use } from 'react'

import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider.js'
import { useAuthContext } from '../contexts/AuthProvider.js'
import { apiUrl } from '../utils/constants.js'
import { IProvideAccountAuthentication } from '../utils/utils.js'

export const useUpdateAvatarMutation = () => {
  const { account, axiosInstance } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: FormData) =>
      axiosInstance.post(`/account/avatar`, content, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: '*/*',
        },
      }),
    onSuccess: () => {
      // Drop the cached profile picture so the new avatar is fetched from the
      // server. The picture query caches a blob URL and never refetches on its
      // own, so we must remove it explicitly to reflect the update.
      const uri = account.getUri()
      const cachedUrl = queryClient.getQueryData<string>(['picture', uri])
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl)
      }
      queryClient.removeQueries({ queryKey: ['picture', uri] })
    },
  })
}

export const useRemoveLinkedDevice = () => {
  const { axiosInstance } = useAuthContext()
  const { setAlertContent } = use(AlertSnackbarContext)

  return useMutation({
    mutationFn: async (content: removedLinkedDeviceContent) => {
      const token = localStorage.getItem('accessToken')
      const { data } = await axiosInstance.post(
        `/account/${content.deviceId}/revoke/`,
        { password: content.password },
        {
          baseURL: apiUrl,
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      return data
    },

    onSuccess: () => {
      setAlertContent({
        messageI18nKey: 'removed_linked_device_success',
        severity: 'success',
        alertOpen: true,
      })
    },

    onError: (e) => {
      console.error('Error removing linked device', e)
      setAlertContent({
        messageI18nKey: 'removed_linked_device_error',
        severity: 'error',
        alertOpen: true,
      })
    },
  })
}

export const useSetDisplayName = () => {
  const { setAlertContent } = use(AlertSnackbarContext)
  return useMutation({
    mutationKey: ['set', 'displayName'],
    mutationFn: async (displayName: string) => {
      const token = localStorage.getItem('accessToken')
      const { data } = await axios.post(
        `/account/display-name`,
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
  const { setAlertContent } = use(AlertSnackbarContext)
  return useMutation({
    mutationKey: ['reset', 'displayName'],
    mutationFn: async () => {
      const token = localStorage.getItem('accessToken')
      const { data } = await axios.post(`/account/display-name/reset`, undefined, {
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

export const useExportAccountMutation = () => {
  const { axiosInstance } = useAuthContext()

  return useMutation({
    mutationKey: ['exportAccount'],
    mutationFn: async (uri: string) => {
      const { data } = await axiosInstance.post(`/account/add-device`, { uri }, { baseURL: apiUrl })
      return data
    },
  })
}

export const useConfirmAddDeviceMutation = (opId: number) => {
  const { axiosInstance } = useAuthContext()

  return useMutation({
    mutationKey: ['exportAccount'],
    mutationFn: async () => {
      const { data } = await axiosInstance.post(`/account/${opId}/confirm-device`, { baseURL: apiUrl })
      return data
    },
  })
}

export const useCancelAddDeviceMutation = (opId: number) => {
  const { axiosInstance } = useAuthContext()

  return useMutation({
    mutationKey: ['exportAccount'],
    mutationFn: async () => {
      const { data } = await axiosInstance.post(`/account/${opId}/cancel-device`, { baseURL: apiUrl })
      return data
    },
  })
}

// Query used only in the import account flow
export const useProvideAccountAuthentication = () => {
  return useMutation({
    mutationKey: ['provideAccountAuthentication'],
    mutationFn: async (values: IProvideAccountAuthentication) => {
      const token = localStorage.getItem('importToken')
      const { data } = await axios.post(
        `/auth/link/authenticate`,
        { values },
        { baseURL: apiUrl, headers: { Authorization: `Bearer ${token}` } },
      )
      return data
    },
  })
}
