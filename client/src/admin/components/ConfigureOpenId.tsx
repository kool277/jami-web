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
import { Box, IconButton, Stack, Switch, TextField } from '@mui/material'
import { AdminSettingSelection } from '@savoirfairelinux/jami-web-common'
import { use, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import BaseButton from '../../components/common/BaseButton.js'
import ProcessingRequest from '../../components/ProcessingRequest.js'
import { ContentCopyIcon, DescriptionIcon } from '../../components/SvgIcon.js'
import { AlertSnackbarContext } from '../../contexts/AlertSnackbarProvider.js'
import { AuthenticationMethods } from '../../enums/authenticationMethods.js'
import { SettingsPage, SettingsRow, SettingsSection } from '../../settings/components/SettingsPage.js'
import { useGetProviderInfo, useUpdateProviderInfo } from '../services/adminQueries.js'

export default function ConfigureOpenId() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setAlertContent } = use(AlertSnackbarContext)
  const [clientId, setClientId] = useState<string>()
  const [clientSecret, setClientSecret] = useState('')
  const providerName = location.pathname.split('/').at(-1)

  if (providerName === undefined) {
    setAlertContent({
      messageI18nKey: 'getting_oauth_provider_info_error',
      severity: 'error',
      alertOpen: true,
    })
    navigate(`/admin/${AdminSettingSelection.AUTHENTICATION}/${AuthenticationMethods.OPENID}`)
  }

  const provider = useGetProviderInfo(providerName || '')
  const updateProviderInfo = useUpdateProviderInfo(providerName || '')

  if (provider.data === undefined) {
    return <ProcessingRequest open />
  }

  if (clientId === undefined) {
    setClientId(provider.data.clientId)
  }

  const onCopy = (value: string) => {
    if (value === '') {
      return
    }

    navigator.clipboard.writeText(value)
    setAlertContent({
      messageI18nKey: 'copied_to_clipboard',
      severity: 'success',
      alertOpen: true,
    })
  }

  const onSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateProviderInfo.mutate({ isActive: event.target.checked })
  }

  const onValidate = () => {
    const data: { clientId?: string; clientSecret?: string } = {}

    if (clientId !== provider.data.clientId) {
      data.clientId = clientId
    }
    if (clientSecret !== '') {
      data.clientSecret = clientSecret
    }
    if (Object.keys(data).length !== 0) {
      updateProviderInfo.mutate(data)
    }
  }

  return (
    <SettingsPage title={provider.data.displayName} description={t('oauth2_provider')}>
      <SettingsSection title={t('oauth2_provider')} description={t('configure_oauth_provider_info')} list={false}>
        <SettingsRow
          title={t('setting_auth_change', { authMethod: provider.data.displayName })}
          control={<Switch checked={provider.data.isActive} onChange={onSwitchChange} />}
        />
      </SettingsSection>
      <SettingsSection title={t('redirect_uri')} list={false}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={provider.data.redirectUri}
            slotProps={{ input: { readOnly: true } }}
          />
          <IconButton aria-label={t('copy_to_clipboard')} onClick={() => onCopy(provider.data.redirectUri)}>
            <ContentCopyIcon />
          </IconButton>
        </Box>
      </SettingsSection>
      <SettingsSection title={t('client_id')} list={false}>
        <TextField
          fullWidth
          size="small"
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
          placeholder={t('client_secret_placeholder') + provider.data.displayName}
        />
      </SettingsSection>
      <SettingsSection title={t('client_secret')} list={false}>
        <TextField
          fullWidth
          size="small"
          type="password"
          value={clientSecret}
          onChange={(event) => setClientSecret(event.target.value)}
          placeholder={t('client_secret_placeholder') + provider.data.displayName}
        />
      </SettingsSection>
      <Stack direction="row" sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <BaseButton
          variant="text"
          color="primary"
          onClick={() => window.open(provider.data.documentation, '_blank', 'noopener,noreferrer')}
          startIcon={<DescriptionIcon />}
        >
          {t('documentation')}
        </BaseButton>
        <BaseButton variant="contained" color="primary" onClick={onValidate}>
          {t('save_button')}
        </BaseButton>
      </Stack>
    </SettingsPage>
  )
}
