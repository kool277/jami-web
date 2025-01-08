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
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { passwordStrength } from 'check-password-strength'
import { AccessToken } from 'jami-web-common'
import { HttpStatusCode } from 'jami-web-common'
import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import { NameStatus } from '../components/Input'
import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider'
import { PasswordStrength } from '../enums/passwordStrength'
import { apiUrl } from '../utils/constants'
import { jamiUsernamePattern } from '../utils/constants'
interface PasswordStrengthResult {
  id: number
  value: string
  contains: string[]
  length: number
}

interface LoginData {
  username: string
  password: string
  authMethod: string
}

interface RegisterData {
  username: string
  password: string
}

export interface PasswordCheckResult {
  strong: boolean
  valueCode: PasswordStrength
}

export type LoginMethod = 'Jami' | 'JAMS'

export const useCheckIfUsernameIsRegisteredQuery = (username: string) => {
  return useQuery({
    queryKey: ['username', username],
    queryFn: async () => {
      const res = await axios.get<NameStatus>(`/ns/username/availability/${username}`, {
        baseURL: apiUrl,
      })
      return { responseMessage: res.data, statusCode: res.status }
    },
    enabled: jamiUsernamePattern.test(username),
  })
}

export function checkPasswordStrength(password: string): PasswordCheckResult {
  const strengthResult: PasswordStrengthResult = passwordStrength(password, [
    {
      id: PasswordStrength.TooWeak,
      value: 'Too weak',
      minDiversity: 0,
      minLength: 0,
    },
    {
      id: PasswordStrength.Weak,
      value: 'Weak',
      minDiversity: 2,
      minLength: 6,
    },
    {
      id: PasswordStrength.Medium,
      value: 'Medium',
      minDiversity: 4,
      minLength: 8,
    },
    {
      id: PasswordStrength.Strong,
      value: 'Strong',
      minDiversity: 4,
      minLength: 10,
    },
  ])
  console.log(strengthResult)

  return {
    strong: strengthResult.id !== PasswordStrength.TooWeak,
    valueCode: strengthResult.id,
  }
}

export const useRegisterMutation = () => {
  const { setAlertContent } = useContext(AlertSnackbarContext)
  return useMutation({
    mutationKey: ['user', 'register'],
    mutationFn: async (registerData: RegisterData) => {
      const response = await axios.post(
        '/auth/new-account',
        { username: registerData.username, password: registerData.password },
        { baseURL: apiUrl },
      )
      return response
    },
    onSuccess: (response) => {
      if (response.status === HttpStatusCode.Created) {
        setAlertContent({ messageI18nKey: 'registration_success', severity: 'success', alertOpen: true })
      }
    },
    onError: (e: any) => {
      const { status } = e.response
      if (status === HttpStatusCode.BadRequest) {
        //TODO: more than one bad request response defined in the server is missing credentials. add the response message to the locale.
      } else if (status === HttpStatusCode.Conflict) {
        //TODO: there are two different conflict responses that could be returned by the server, use message to differentiate them?
      } else if (status === HttpStatusCode.Unauthorized) {
        //TODO: this is a response for JAMS, add message to the locale
      } else {
        setAlertContent({ messageI18nKey: 'unknown_error_alert', severity: 'error', alertOpen: true })
      }
    },
  })
}

export const useLoginMutation = () => {
  const navigate = useNavigate()
  const { setAlertContent, closeAlert } = useContext(AlertSnackbarContext)
  return useMutation({
    mutationKey: ['user', 'login'],
    mutationFn: async (loginData: LoginData) => {
      const { data } = await axios.post<AccessToken>(
        '/auth/login',
        { username: loginData.username, password: loginData.password, authMethod: loginData.authMethod },
        { baseURL: apiUrl },
      )
      return data
    },
    onMutate: () => {
      closeAlert()
    },
    onSuccess: (response) => {
      setAccessToken(response.accessToken)
      navigate('/conversation', { replace: true })
    },
    onError: (e: any) => {
      //e: any is a simple workaround for type check since the error is of type unknown and we can't reference a property on an unknown
      const { status } = e.response
      if (status === HttpStatusCode.BadRequest) {
        //TODO: the only bad request response defined in the server is missing credentials. add the response message to the locale.
        //continue when the auth flow is clear
      } else if (status === HttpStatusCode.NotFound) {
        //TODO: there are two different not found responses that could be returned by the server, use message to differentiate them?
        //continue when the auth flow is clear
      } else if (status === HttpStatusCode.Unauthorized) {
        setAlertContent({ messageI18nKey: 'login_invalid_credentials', severity: 'error', alertOpen: true })
      } else {
        setAlertContent({ messageI18nKey: 'unknown_error_alert', severity: 'error', alertOpen: true })
      }
    },
  })
}

export function getAccessToken(): string | undefined {
  return localStorage.getItem('accessToken') ?? undefined
}

export function setAccessToken(accessToken: string): void {
  localStorage.setItem('accessToken', accessToken)
}

export const useExtendSessionForGuest = () => {
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const token = localStorage.getItem('accessToken')
  return useMutation({
    mutationKey: ['extend', 'session'],
    mutationFn: async () => {
      const { data } = await axios.post(`/account/guest/extend`, {
        baseURL: apiUrl,
        headers: { Authorization: `Bearer ${token}` },
      })
      return data
    },
    onSuccess: (response) => {
      setAccessToken(response.accessToken)
      setAlertContent({
        messageI18nKey: 'extending_session_success_alert',
        severity: 'success',
        alertOpen: true,
      })
    },
    onError: () => {
      setAlertContent({
        messageI18nKey: 'extending_session_error_alert',
        severity: 'error',
        alertOpen: true,
      })
    },
  })
}
export const useGetAllProviders = () => {
  return useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const res = await axios.get('/auth/oauth/providers', { baseURL: apiUrl })
      return res.data
    },
    refetchOnWindowFocus: true,
    refetchInterval: 0,
  })
}
