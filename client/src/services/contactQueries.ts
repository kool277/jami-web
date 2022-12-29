/*
 * Copyright (C) 2022 Savoir-faire Linux Inc.
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
import { useMutation, useQuery } from '@tanstack/react-query';
import { ContactDetails, LookupResult } from 'jami-web-common';

import { useAuthContext } from '../contexts/AuthProvider';
import { Contact } from '../models/contact';
import { useRefreshConversationsSummaries } from './conversationQueries';

export const useContactsSearchQuery = (searchQuery: string) => {
  const { axiosInstance } = useAuthContext();
  return useQuery({
    queryKey: ['nameserver', searchQuery],
    queryFn: async () => {
      const { data } = await axiosInstance.get<LookupResult>(`/ns/username/${searchQuery}`);
      return data ? [new Contact(data.address, data.username)] : [];
    },
    enabled: !!searchQuery,
  });
};

export const useAddContactMutation = () => {
  const { axiosInstance } = useAuthContext();

  const refreshConversationsSummaries = useRefreshConversationsSummaries();

  return useMutation({
    mutationFn: async (contactId: string) => {
      const { data } = await axiosInstance.put<ContactDetails>(`/contacts/${contactId}`);
      return data;
    },
    onSuccess: () => {
      refreshConversationsSummaries();
    },
  });
};
