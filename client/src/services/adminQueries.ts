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

import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { AccessToken } from 'jami-web-common';

import { apiUrl } from '../utils/constants';

export const useSetupAdminMutation = () => {
  return useMutation({
    mutationKey: ['admin', 'setup'],
    mutationFn: async (password: string) => {
      const { data } = await axios.post('/setup/admin/create', { password }, { baseURL: apiUrl });
      return data;
    },
  });
};

export const useLoginAdminMutation = () => {
  return useMutation({
    mutationKey: ['admin', 'login'],
    mutationFn: async (password: string) => {
      const { data } = await axios.post<AccessToken>('/setup/admin/login', { password }, { baseURL: apiUrl });
      return data;
    },
  });
};

export async function checkAdminSetupStatus(): Promise<boolean> {
  try {
    const { data } = await axios.get<{ isSetupComplete: boolean }>('/setup/check', { baseURL: apiUrl });
    return data.isSetupComplete;
  } catch (e) {
    throw new Error('Cannot connect to server', { cause: e });
  }
}
