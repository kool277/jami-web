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
import GroupAddRounded from '@mui/icons-material/GroupAddRounded';
import { Box, Card, CardContent, Container, Fab, Input, Typography } from '@mui/material';
import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useLoginAdminMutation } from '../services/adminQueries';
export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loginAdminMutation = useLoginAdminMutation();
  const { data, isSuccess, isLoading } = loginAdminMutation;

  if (isSuccess) {
    localStorage.setItem('adminAccessToken', data.accessToken);
  }

  /*
  TODO: handle following errors (not all of them should cause redirection)
    res.status(HttpStatusCode.BadRequest).send('Missing password in body');
    res.status(HttpStatusCode.InternalServerError).send('Admin password not found');
    res.status(HttpStatusCode.Forbidden).send('Incorrect password');
  */

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    loginAdminMutation.mutate(password, {
      onSuccess: () => {
        navigate('/admin');
      },
      onError: () => {
        navigate('/login');
      },
    });
  };
  //TODO: refactor translations
  return (
    <>
      <Container className="message-list">
        <Card>
          <CardContent component="form" onSubmit={handleSubmit}>
            <Typography gutterBottom variant="h5" component="h2">
              {t('setup_login_title')}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="p">
              {t('setup_login_welcome')}
            </Typography>

            <Box style={{ textAlign: 'center', marginTop: 8, marginBottom: 16 }}>
              <div>
                <Input value="admin" name="username" autoComplete="username" disabled />
              </div>
              <div>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  name="password"
                  type="password"
                  placeholder={t('password_placeholder')}
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>
            </Box>
            <Box style={{ textAlign: 'center', marginTop: 24 }}>
              <Fab variant="extended" color="primary" type="submit" disabled={isLoading}>
                <GroupAddRounded />
                {t('login_form_submit_button')}
              </Fab>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
