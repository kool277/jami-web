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
import axios from 'axios'

import { useAuthContext } from '../contexts/AuthProvider'
import { apiUrl } from '../utils/constants'

export const useSendFilesMutation = (conversationId: string) => {
  const { axiosInstance } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: FormData) =>
      axiosInstance.post(
        `/data/${conversationId}`,

        content,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Accept: '*/*',
          },
        },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }),
  })
}

export const useGetAutoDownloadLimit = () => {
  return useQuery({
    queryKey: ['get', 'autoDownloadLimit'],
    queryFn: async () => {
      const { data } = await axios.get(`/data/autoDownloadLimit`, { baseURL: apiUrl })
      return data
    },
  })
}

interface Content {
  messageId: string
  fileId: string
}

export const GetDownloadedFile = (conversationId: string) => {
  const { axiosInstance } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (content: Content) =>
      axiosInstance.get(`/data/${conversationId}/${content.messageId}/${content.fileId}`, {
        responseType: 'blob',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }),
  })
}
