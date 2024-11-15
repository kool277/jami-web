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
import { AxiosResponse } from 'axios'
import {
  ConversationInfos,
  ConversationPreferences,
  IConversationMember,
  IConversationRequest,
  IConversationSummary,
  Message,
} from 'jami-web-common'
import { useCallback, useContext } from 'react'

import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider'
import { useAuthContext } from '../contexts/AuthProvider'
import { ConversationMember } from '../models/conversation-member'
import { useAddToCache, useRemoveFromCache } from '../utils/reactquery'

export const useConversationInfosQuery = (conversationId?: string) => {
  const { axiosInstance } = useAuthContext()
  return useQuery({
    queryKey: ['conversations', conversationId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ConversationInfos>(`/conversations/${conversationId}/infos`)
      return data
    },
    enabled: !!conversationId,
  })
}

export const useConversationInfosMutation = (conversationId: string) => {
  const { axiosInstance } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (conversationInfos: ConversationInfos) =>
      axiosInstance.post(`/conversations/${conversationId}/infos`, conversationInfos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', conversationId] })
    },
  })
}

export const useConversationsSummariesQuery = () => {
  const { axiosInstance } = useAuthContext()
  return useQuery({
    queryKey: ['conversations', 'summaries'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<IConversationSummary[]>(`/conversations`)
      console.log('DATA', data)
      return data
    },
  })
}

const checkConversationSummariesAreEqual = (
  conversationSummary1: IConversationSummary,
  conversationSummary2: IConversationSummary,
) => conversationSummary1.id === conversationSummary2.id
const checkIsConversationSummaryFn = (conversationSummary: IConversationSummary, conversationId: string) =>
  conversationSummary.id === conversationId

export const useAddConversationSummaryToCache = () =>
  useAddToCache(['conversations', 'summaries'], checkConversationSummariesAreEqual)
export const useRemoveConversationSummaryFromCache = () =>
  useRemoveFromCache(['conversations', 'summaries'], checkIsConversationSummaryFn)

export const useRemoveConversationMutation = () => {
  const { axiosInstance } = useAuthContext()
  const removeConversationSummaryFromCache = useRemoveConversationSummaryFromCache()

  return useMutation({
    mutationFn: ({ conversationId }: { conversationId: string }) =>
      axiosInstance.delete(`/conversations/${conversationId}`),
    onSuccess: (_data, { conversationId }) => {
      removeConversationSummaryFromCache(conversationId)
    },
  })
}

export const useRefreshConversationsSummaries = () => {
  const queryClient = useQueryClient()
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['conversations', 'summaries'] })
  }, [queryClient])
}

export const useMembersQuery = (conversationId?: string) => {
  const { axiosInstance } = useAuthContext()
  return useQuery({
    queryKey: ['conversations', conversationId, 'members'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<IConversationMember[]>(`/conversations/${conversationId}/members`)
      return data.map((item) => ConversationMember.fromInterface(item))
    },
    enabled: !!conversationId,
  })
}

export const useMessagesQuery = (conversationId: string) => {
  const { axiosInstance } = useAuthContext()
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<Message[]>(`/conversations/${conversationId}/messages`)
      return data
    },
    enabled: !!conversationId,
  })
}

export const useSendMessageMutation = (conversationId: string) => {
  const { axiosInstance } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (message: string) =>
      axiosInstance.post(`/conversations/${conversationId}/messages`, {
        message,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }),
  })
}

export const useEditMessageMutation = (conversationId: string) => {
  const { axiosInstance } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (message: string) =>
      axiosInstance.post(`/conversations/${conversationId}/editmessage`, {
        message,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }),
  })
}

export const useDeleteMessageMutation = (conversationId: string) => {
  const { axiosInstance } = useAuthContext()
  const queryClient = useQueryClient()
  const { setAlertContent } = useContext(AlertSnackbarContext)
  return useMutation({
    mutationFn: (messageId: string) => axiosInstance.delete(`/conversations/delete/${conversationId}/${messageId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }),
    onError: () => {
      setAlertContent({
        messageI18nKey: 'error_cannot_delete_message',
        severity: 'error',
        alertOpen: true,
      })
    },
  })
}

const CheckConversationRequestsAreEqual = (
  conversationRequest1: IConversationRequest,
  conversationRequest2: IConversationRequest,
) => conversationRequest1.conversationId === conversationRequest2.conversationId
const checkIsConversationRequestFn = (conversationRequest: IConversationRequest, conversationId: string) =>
  conversationRequest.conversationId === conversationId

export const useAddConversationRequestToCache = () =>
  useAddToCache(['conversationsRequests'], CheckConversationRequestsAreEqual)
export const useRemoveConversationRequestFromCache = () =>
  useRemoveFromCache(['conversationsRequests'], checkIsConversationRequestFn)

export const useConversationRequestsQuery = () => {
  const { axiosInstance } = useAuthContext()
  return useQuery({
    queryKey: ['conversationRequests'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<IConversationRequest[]>('/conversation-requests/')
      return data
    },
  })
}

export const useAcceptConversationRequestMutation = () => {
  const { axiosInstance } = useAuthContext()
  const addConversationSummaryToCache = useAddConversationSummaryToCache()
  const removeConversationRequestFromCache = useRemoveConversationRequestFromCache()
  return useMutation({
    mutationFn: async (variables: { conversationId: string }) => {
      const { data } = await axiosInstance.post<undefined, AxiosResponse<IConversationSummary>>(
        `/conversation-requests/${variables.conversationId}`,
      )
      return data
    },
    onSuccess: (data, { conversationId }) => {
      addConversationSummaryToCache(data)
      removeConversationRequestFromCache(conversationId)
    },
  })
}

export const useBlockConversationRequestMutation = () => {
  const { axiosInstance } = useAuthContext()
  const removeConversationRequestFromCache = useRemoveConversationRequestFromCache()
  return useMutation({
    mutationFn: ({ conversationId }: { conversationId: string }) =>
      axiosInstance.post(`/conversation-requests/${conversationId}/block`),
    onSuccess: (_data, { conversationId }) => {
      removeConversationRequestFromCache(conversationId)
    },
  })
}

export const useDeclineConversationRequestMutation = () => {
  const { axiosInstance } = useAuthContext()
  const removeConversationRequestFromCache = useRemoveConversationRequestFromCache()
  return useMutation({
    mutationFn: ({ conversationId }: { conversationId: string }) =>
      axiosInstance.delete(`/conversation-requests/${conversationId}`),
    onSuccess: (_data, { conversationId }) => {
      removeConversationRequestFromCache(conversationId)
    },
  })
}

export const useAddMemberToSwarm = (conversationId: string) => {
  const { axiosInstance } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (contactUri: string[]) =>
      axiosInstance.post(`/conversations/${conversationId}/add-to-swarm`, { contactUri }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', 'summaries'] })
    },
  })
}

export const useRemoveMemberFromSwarm = (conversationId: string) => {
  const { axiosInstance } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (contactUri: string) =>
      axiosInstance.post(`/conversations/${conversationId}/remove-from-swarm`, { contactUri }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', 'summaries'] })
    },
  })
}

export const useConversationPreferencesQuery = (conversationId: string) => {
  const { axiosInstance } = useAuthContext()
  return useQuery({
    queryKey: ['conversationPreferences', conversationId],
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/conversations/${conversationId}/preferences`)
      return data
    },
  })
}

export const useConversationPreferencesMutation = (conversationId: string) => {
  const { axiosInstance } = useAuthContext()
  const queryClient = useQueryClient()
  const { setAlertContent } = useContext(AlertSnackbarContext)
  return useMutation({
    mutationFn: (preferences: ConversationPreferences) =>
      axiosInstance.post(`/conversations/${conversationId}/preferences`, preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversationPreferences', conversationId] })
    },
    onError: () => {
      setAlertContent({
        messageI18nKey: 'update_conversation_preferences_error',
        severity: 'error',
        alertOpen: true,
      })
    },
  })
}
