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
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  Input,
  Switch,
  Theme,
  Typography,
  useTheme,
} from '@mui/material'
import { ChangeEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Form, Navigate } from 'react-router-dom'

import { useGetAdminConfigQuery, useUpdateAdminConfigMutation } from '../../services/adminQueries'
import ProcessingRequest from '../ProcessingRequest'

const LocalAuthMethod = () => {
  const { t } = useTranslation()
  const accessToken = localStorage.getItem('adminAccessToken')
  const saveAdminConfigMutation = useUpdateAdminConfigMutation()
  const [nameServer, setNameServer] = useState<string>('') // call the server to get the currect value
  const { data } = useGetAdminConfigQuery()
  const theme: Theme = useTheme()

  if (!accessToken) {
    return <Navigate to="/admin/login" replace />
  }

  // TODO: handle error and notify the user that something went wrong
  if (data === undefined) {
    return <ProcessingRequest open />
  }

  const handleChange = () => {
    saveAdminConfigMutation.mutate({ localAuthEnabled: !data.localAuthEnabled })
  }

  const handleNameChangeNameServer = (event: ChangeEvent<HTMLInputElement>) => {
    setNameServer(event.target.value)
  }

  const submitNewNameServer = () => {
    // still need to implement the server call
    console.log('submitting new name server')
  }

  return (
    <Box sx={{ textAlign: 'start', marginTop: '8%' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignContent: 'center',
          height: '3rem',
        }}
      >
        <span style={{ paddingRight: '10%' }}>{t('setting_auth_jami_change')}</span>
        <FormControl>
          <FormGroup style={{ marginTop: '2%', alignItems: 'center' }}>
            <FormControlLabel
              control={<Switch checked={data.localAuthEnabled} onChange={handleChange} />}
              label={undefined}
            />
          </FormGroup>
        </FormControl>
      </Box>
      <Box sx={{ textAlign: 'start', alignItems: 'start', marginTop: '8%' }}>
        <Typography>{t('setting_name_server')}</Typography>
        <Form>
          <Input value={nameServer} onChange={handleNameChangeNameServer} />
          <Button
            variant="contained"
            type="submit"
            onClick={submitNewNameServer}
            sx={{ mt: theme.typography.pxToRem(20), marginLeft: theme.typography.pxToRem(10), marginTop: '-4%' }}
            disabled={nameServer === ''}
          >
            {t('save_button')}
          </Button>
        </Form>
      </Box>
    </Box>
  )
}

export default LocalAuthMethod
