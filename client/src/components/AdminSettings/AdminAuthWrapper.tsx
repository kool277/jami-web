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

import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AlertSnackbarContext } from '../../contexts/AlertSnackbarProvider'
import { useCheckAdminTokenValidity } from '../../services/adminQueries'
import { isElectronMode } from '../../utils/electron'
import LoadingPage from '../Loading'

interface AdminAuthWrapperProps {
  children: React.ReactNode
}

export default function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const navigate = useNavigate()
  const verifyAdminToken = useCheckAdminTokenValidity()
  const [loading, setLoading] = useState(!isElectronMode())

  useEffect(() => {
    // In Electron mode, admin auth is bypassed
    if (isElectronMode()) {
      return
    }

    if (!localStorage.getItem('adminAccessToken')) {
      navigate('/admin/login')
      return
    }

    verifyAdminToken.then((res) => {
      setLoading(false)
      if (res === false) {
        localStorage.removeItem('adminAccessToken')
        setAlertContent({
          messageI18nKey: 'unauthorized_access',
          severity: 'error',
          alertOpen: true,
        })
        navigate('/admin/login')
      }
    })
  }, [verifyAdminToken, navigate, setAlertContent])

  if (loading) {
    return <LoadingPage />
  }

  // only returns the children
  return <>{children}</>
}
