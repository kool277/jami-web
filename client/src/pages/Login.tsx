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
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Theme, useTheme } from '@mui/material/styles';
import { HttpStatusCode } from 'jami-web-common';
import { ChangeEvent, FormEvent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Link, useNavigate } from 'react-router-dom';

import { AlertSnackbar } from '../components/AlertSnackbar';
import { PasswordInput, UsernameInput } from '../components/Input';
import ProcessingRequest from '../components/ProcessingRequest';
import withAuthUI from '../components/WithAuthUI';
import { loginUser, setAccessToken } from '../utils/auth';
import { inputWidth } from '../utils/constants';
function LoginForm() {
  const theme: Theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isJams, setIsJams] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorAlertContent, setErrorAlertContent] = useState<ReactNode>(undefined);
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'));

  const handleUsername = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  const handlePassword = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleIsJams = (event: ChangeEvent<HTMLInputElement>) => {
    setIsJams(event.target.value === 'true');
  };

  const login = async (event: FormEvent) => {
    event.preventDefault();

    if (!(username.length > 0) || !(password.length > 0)) {
      //TODO: set alert message
      console.log('Empty Credentials');
      return;
    }

    setLoading(true);

    loginUser(username, password, isJams)
      .then((response) => {
        if (response.status === HttpStatusCode.Ok) {
          setAccessToken(response.data.accessToken);
          navigate('/conversation', { replace: true });
        }
      })
      .catch((e) => {
        console.log(e);
        const { status } = e.response;
        if (status === HttpStatusCode.BadRequest) {
          //TODO: the only bad request response defined in the server is missing credentials. add the response message to the locale.
          console.log(e.response.data);
          // setErrorAlertContent(t('unknown_error_alert'));
        } else if (status === HttpStatusCode.NotFound) {
          //TODO: there are two different not found responses that could be returned by the server, use message to differentiate them?
          console.log(e.response.data);
          // setErrorAlertContent(t('login_username_not_found'));
        } else if (status === HttpStatusCode.Unauthorized) {
          setErrorAlertContent(t('login_invalid_password'));
        } else {
          setErrorAlertContent(t('unknown_error_alert'));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <ProcessingRequest open={loading} />

      <AlertSnackbar severity={'error'} open={!!errorAlertContent} onClose={() => setErrorAlertContent(undefined)}>
        {errorAlertContent}
      </AlertSnackbar>

      <Stack
        sx={{
          minHeight: `${isMobile ? 'auto' : '100%'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ mt: theme.typography.pxToRem(50), mb: theme.typography.pxToRem(20) }}>
          <Typography component={'span'} variant="h2">
            {t('login_form_title')}
          </Typography>
        </Box>

        <Form method="post" id="login-form">
          <div>
            <UsernameInput
              value={username}
              onChange={handleUsername}
              tooltipTitle={t('login_form_username_tooltip')}
              sx={{ width: theme.typography.pxToRem(inputWidth) }}
            />
          </div>
          <div>
            <PasswordInput
              value={password}
              onChange={handlePassword}
              tooltipTitle={t('login_form_password_tooltip')}
              sx={{ width: theme.typography.pxToRem(inputWidth) }}
            />
          </div>
          <div>
            <FormControl
              sx={{
                width: theme.typography.pxToRem(inputWidth),
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <RadioGroup row onChange={handleIsJams} value={isJams}>
                <FormControlLabel value="false" control={<Radio />} label={t('jami')} />
                <FormControlLabel value="true" control={<Radio />} label={t('jams')} />
              </RadioGroup>
            </FormControl>
          </div>

          <Button
            variant="contained"
            type="submit"
            onClick={login}
            sx={{ width: theme.typography.pxToRem(inputWidth), mt: theme.typography.pxToRem(20) }}
          >
            {t('login_form_submit_button')}
          </Button>
        </Form>

        <Box sx={{ mt: theme.typography.pxToRem(50), mb: theme.typography.pxToRem(50) }}>
          <Typography variant="body1">
            {t('login_form_to_registration_text')} &nbsp;
            <Link to={'/register'}>{t('login_form_to_registration_link')}</Link>
          </Typography>
        </Box>
      </Stack>
    </>
  );
}

export default withAuthUI(LoginForm);
