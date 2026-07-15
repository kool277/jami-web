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

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  FormGroup,
  Input,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { AdminSettingSelection } from '@savoirfairelinux/jami-web-common'
import { use, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import ProcessingRequest from '../../components/ProcessingRequest.js'
import { ContentCopyIcon, DescriptionIcon } from '../../components/SvgIcon.js'
import { AlertSnackbarContext } from '../../contexts/AlertSnackbarProvider.js'
import { AuthenticationMethods } from '../../enums/authenticationMethods.js'
import { useGetProviderInfo, useUpdateProviderInfo } from '../services/adminQueries.js'

export default function ConfigureOpenId() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { setAlertContent } = use(AlertSnackbarContext)
  const [clientId, setClientId] = useState<string>()
  const [clientSecret, setClientSecret] = useState('')
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const providerName = location.pathname.split('/').at(-1)

  if (providerName === undefined) {
    setAlertContent({
      messageI18nKey: 'getting_oauth_provider_info_error',
      severity: 'error',
      alertOpen: true,
    })
    navigate(`/admin/${AdminSettingSelection.AUTHENTICATION}/${AuthenticationMethods.OPENID}`)
  }

  // the provider here will never be '' because of the previous if statement
  // this is just to avoid the TS error
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.type === 'text') {
      setClientId(e.target.value)
    } else {
      setClientSecret(e.target.value)
    }
  }

  const onSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const data = {
      isActive: e.target.checked,
    }
    updateProviderInfo.mutate(data)
  }

  const onValidate = () => {
    const data: { clientId?: string; clientSecret?: string } = {}

    if (clientId !== provider.data.clientId) {
      data['clientId'] = clientId
    }

    if (clientSecret !== '') {
      data['clientSecret'] = clientSecret
    }
    if (Object.keys(data).length !== 0) {
      updateProviderInfo.mutate(data)
    }
  }

  const boxInputStyle = {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '16px',
  }
  const inputStyle = { width: '98%' }
  const contentCopyIconStyle = { cursor: 'pointer' }

  return (
    <Box
      sx={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', alignContent: 'center' }}
    >
      <Card
        sx={{
          width: '420px',
          height: '580px',
          marginTop: '-50px',
          boxShadow: isMobile ? 'none' : undefined,
          border: isMobile ? 'none' : undefined,
        }}
      >
        <CardHeader
          title={
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignContent: 'center',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Typography sx={{ marginLeft: '-8px' }} variant="h3">
                {provider.data.displayName}
              </Typography>
              <img src={provider.data.icon} style={{ width: '40px', height: '40px', marginTop: '5px' }} />
            </Box>
          }
          subheader={<Box sx={{ display: 'flex', flexDirection: 'column' }}>{t('oauth2_provider')}</Box>}
        />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', marginTop: '-16px' }}>
          <Box sx={{ marginBottom: '24px' }}>
            <Typography>{t('configure_oauth_provider_info')}</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItens: 'center',
              alignContent: 'center',
              width: '100%',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}
          >
            <span style={{ paddingRight: '10%' }}>
              {t('setting_auth_change', { authMethod: provider.data.displayName })}
            </span>
            <FormGroup style={{ alignItems: 'center' }}>
              <FormControlLabel
                control={<Switch checked={provider.data.isActive} onChange={onSwitchChange} />}
                label={undefined}
              />
            </FormGroup>
          </Box>
          <Typography>{t('redirect_uri')}</Typography>
          <Box sx={boxInputStyle}>
            <Input sx={inputStyle} type="text" value={provider.data.redirectUri} disabled></Input>
            <ContentCopyIcon
              sx={contentCopyIconStyle}
              onClick={() => {
                onCopy(provider.data.redirectUri)
              }}
            />
          </Box>

          <Typography>{t('client_id')}</Typography>
          <Box sx={boxInputStyle}>
            <Input
              sx={inputStyle}
              type="text"
              onChange={onChange}
              placeholder={t('client_secret_placeholder') + provider.data.displayName}
              value={clientId}
            ></Input>
            <ContentCopyIcon sx={{ ...contentCopyIconStyle, visibility: 'hidden' }} />
          </Box>

          <Typography>{t('client_secret')}</Typography>
          <Box sx={boxInputStyle}>
            <Input
              sx={inputStyle}
              onChange={onChange}
              placeholder={t('client_secret_placeholder') + provider.data.displayName}
              type="password"
              value={clientSecret}
            ></Input>
            <ContentCopyIcon sx={{ ...contentCopyIconStyle, visibility: 'hidden' }} />
          </Box>
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button
              color="primary"
              onClick={() => window.open(provider.data.documentation, '_blank', 'noopener,noreferrer')}
            >
              <DescriptionIcon />
              {t('documentation')}
            </Button>
            <Button variant="contained" color="primary" onClick={onValidate}>
              {t('save_button')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
