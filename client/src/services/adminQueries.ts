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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { AccessToken, IAdminConfigState } from 'jami-web-common'
import { HttpStatusCode } from 'jami-web-common'
import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider'
import { apiUrl } from '../utils/constants'

export const useSetupAdminMutation = () => {
  const navigate = useNavigate()
  const { setAlertContent } = useContext(AlertSnackbarContext)

  return useMutation({
    mutationKey: ['admin', 'setup'],
    mutationFn: async (password: string) => {
      const { data } = await axios.post('/admin/create', { password }, { baseURL: apiUrl })
      return data
    },
    onSuccess: () => {
      //TODO: Do not login the admin for now in case we need to implement multi-factor authentication
      navigate('/admin/login')
    },
    onError: (e: any) => {
      if (e.response?.status === HttpStatusCode.BadRequest) {
        setAlertContent({
          messageI18nKey: 'login_invalid_credentials',
          severity: 'error',
          alertOpen: true,
        })
      } else {
        setAlertContent({
          messageI18nKey: 'unknown_error_alert',
          severity: 'error',
          alertOpen: true,
        })
      }
    },
  })
}

export const useLoginAdminMutation = () => {
  const navigate = useNavigate()
  const { setAlertContent } = useContext(AlertSnackbarContext)

  return useMutation({
    mutationKey: ['admin', 'login'],
    mutationFn: async (password: string) => {
      const { data } = await axios.post<AccessToken>('/admin/login', { password }, { baseURL: apiUrl })
      return data
    },
    onSuccess: (data) => {
      localStorage.setItem('adminAccessToken', data.accessToken)
      navigate('/admin')
    },
    onError: (e: any) => {
      if (e.response?.status === HttpStatusCode.Forbidden) {
        setAlertContent({
          messageI18nKey: 'admin_page_setup_not_complete',
          severity: 'error',
          alertOpen: true,
        })
      } else if (e.response?.status === HttpStatusCode.BadRequest) {
        setAlertContent({
          messageI18nKey: 'password_input_helper_text_empty',
          severity: 'error',
          alertOpen: true,
        })
      } else if (e.response?.status === HttpStatusCode.Unauthorized) {
        setAlertContent({
          messageI18nKey: 'login_invalid_credentials',
          severity: 'error',
          alertOpen: true,
        })
      } else {
        setAlertContent({
          messageI18nKey: 'unknown_error_alert',
          severity: 'error',
          alertOpen: true,
        })
      }
    },
  })
}

//For non-react components that need to get the admin setup status
export const checkAdminSetupStatus = async () => {
  try {
    const { data } = await axios.get<{ isSetupComplete: boolean }>('/admin/check', { baseURL: apiUrl })
    return data.isSetupComplete
  } catch (e) {
    console.log(e)
  }
}

//For react components that can invoke hooks
export const useCheckAdminSetupStatusQuery = () => {
  return useQuery({
    queryKey: ['admin', 'status'],
    queryFn: async () => {
      const { data } = await axios.get<{ isSetupComplete: boolean }>('/admin/check', { baseURL: apiUrl })
      return data.isSetupComplete
    },
  })
}

export const useGetNameServer = () => {
  const token = localStorage.getItem('adminAccessToken')
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const query = useQuery({
    queryKey: ['nameserver', 'getter'],
    queryFn: async () => {
      const { data } = await axios.get('/admin/nameserver', {
        baseURL: apiUrl,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return data
    },
  })
  useEffect(() => {
    if (query.error) {
      setAlertContent({
        messageI18nKey: 'getting_name_server_error',
        severity: 'error',
        alertOpen: true,
      })
    }
  }, [query.error, setAlertContent])

  return query
}

export const useResetNameServer = () => {
  const token = localStorage.getItem('adminAccessToken')
  const queryClient = useQueryClient()
  const { setAlertContent } = useContext(AlertSnackbarContext)
  return useMutation({
    mutationKey: ['nameserver', 'reset'],
    mutationFn: async () => {
      const { data } = await axios.delete(`/admin/nameserver`, {
        baseURL: apiUrl,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nameserver', 'getter'] })
    },
    onError: () => {
      setAlertContent({
        messageI18nKey: 'setting_name_server_error',
        severity: 'error',
        alertOpen: true,
      })
    },
  })
}

export const useSetNameServer = () => {
  const token = localStorage.getItem('adminAccessToken')
  const queryClient = useQueryClient()
  const { setAlertContent } = useContext(AlertSnackbarContext)
  return useMutation({
    mutationKey: ['nameserver', 'setter'],
    mutationFn: async (nameserver: string) => {
      const { data } = await axios.post(
        '/admin/nameserver',
        { nameserver },
        {
          baseURL: apiUrl,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nameserver', 'getter'] })
    },
    onError: () => {
      setAlertContent({
        messageI18nKey: 'setting_name_server_error',
        severity: 'error',
        alertOpen: true,
      })
    },
  })
}

export const useGetAdminConfigQuery = () => {
  const navigate = useNavigate()
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const query = useQuery({
    queryKey: ['admin', 'config'],
    queryFn: async () => {
      const { data } = await axios.get('/admin/config', {
        baseURL: apiUrl,
        //TODO: create a intercepted axios instance for auth-required requests
      })
      return data
    } /*,
    onError: (e: any) => {
      if (e.response.status === HttpStatusCode.Unauthorized) {
        localStorage.removeItem('adminAccessToken')
        navigate('/admin/login')
      } else {
        setAlertContent({
          messageI18nKey: 'unknown_error_alert',
          severity: 'error',
          alertOpen: true,
        })
      }
    },*/,
  })

  useEffect(() => {
    if (query.error) {
      const response = query.error as AxiosError
      if (response?.status === HttpStatusCode.Unauthorized) {
        localStorage.removeItem('adminAccessToken')
        navigate('/admin/login')
      } else {
        setAlertContent({
          messageI18nKey: 'unknown_error_alert',
          severity: 'error',
          alertOpen: true,
        })
      }
    }
  }, [query.error, navigate, setAlertContent])

  return query
}

export const useUpdateAdminConfigMutation = () => {
  const token = localStorage.getItem('adminAccessToken')
  const navigate = useNavigate()
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (adminConfig: Partial<IAdminConfigState>) => {
      const response = await axios.patch('/admin/config', adminConfig, {
        baseURL: apiUrl,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'config'] })
    },
    onError: (e: any) => {
      if (e.repsponse.status === HttpStatusCode.Unauthorized) {
        localStorage.removeItem('adminAccessToken')
        navigate('/admin/login')
      } else {
        setAlertContent({
          messageI18nKey: 'unknown_error_alert',
          severity: 'error',
          alertOpen: true,
        })
      }
    },
  })
}

export const useGetAdminAuthMethods = async () => {
  try {
    const token = localStorage.getItem('adminAccessToken')
    const response = await axios.get('/admin/config', {
      baseURL: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return [
      response.data.localAuthEnabled,
      response.data.jamsAuthEnabled,
      response.data.guestAccessEnabled,
      response.data.openIdAuthEnabled,
    ]
  } catch (e: any) {
    console.log('Erreur ', e)
  }
}

export const useGetJamsUrl = () => {
  const token = localStorage.getItem('adminAccessToken')
  return useQuery({
    queryKey: ['jamsurl', 'getter'],
    queryFn: async () => {
      const { data } = await axios.get('/admin/jamsurl', {
        baseURL: apiUrl,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return data
    },
  })
}
export const useRemoveJamsUrl = () => {
  const token = localStorage.getItem('adminAccessToken')
  const queryClient = useQueryClient()
  const { setAlertContent } = useContext(AlertSnackbarContext)
  return useMutation({
    mutationKey: ['jamsurl', 'reset'],
    mutationFn: async () => {
      const { data } = await axios.delete(`/admin/jamsurl`, {
        baseURL: apiUrl,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jamsurl', 'getter'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'config'] })
      setAlertContent({
        messageI18nKey: 'removing_jams_server_success',
        severity: 'success',
        alertOpen: true,
      })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['jamsurl', 'getter'] })
      setAlertContent({
        messageI18nKey: 'removing_jams_server_error',
        severity: 'error',
        alertOpen: true,
      })
    },
  })
}
export const useSetJamsUrl = () => {
  const token = localStorage.getItem('adminAccessToken')
  const queryClient = useQueryClient()
  const { setAlertContent } = useContext(AlertSnackbarContext)
  return useMutation({
    mutationKey: ['jamsurl', 'setter'],
    mutationFn: async (url: string) => {
      const { data } = await axios.post(
        '/admin/jamsurl',
        { url },
        {
          baseURL: apiUrl,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nameserver', 'getter'] })
      setAlertContent({
        messageI18nKey: 'setting_jams_server_success',
        severity: 'success',
        alertOpen: true,
      })
    },
    onError: () => {
      setAlertContent({
        messageI18nKey: 'setting_jams_server_error',
        severity: 'error',
        alertOpen: true,
      })
    },
  })
}

export const useCheckAdminTokenValidity = async () => {
  const token = localStorage.getItem('adminAccessToken')
  try {
    const response = await axios.get('/admin/isTokenValid', {
      baseURL: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    if (response.status === HttpStatusCode.Ok) {
      return true
    }
  } catch (e: any) {
    if (e.response?.status === HttpStatusCode.Unauthorized) {
      console.error('Admin token is invalid')
    }
  }
  return false
}
