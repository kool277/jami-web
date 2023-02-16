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
import { ChangeEvent, FormEvent, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Link } from 'react-router-dom';

import { PasswordInput, UsernameInput } from '../components/Input';
import ProcessingRequest from '../components/ProcessingRequest';
import withAuthUI from '../components/WithAuthUI';
import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider';
import { useLoginMutation } from '../services/authQueries';
import { inputWidth } from '../utils/constants';
function LoginForm() {
  const theme: Theme = useTheme();
  const { t } = useTranslation();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isJams, setIsJams] = useState<boolean>(false);

  const { setAlertContent } = useContext(AlertSnackbarContext);

  const loginMutation = useLoginMutation();
  const { isLoading } = loginMutation;

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

  const login = (event: FormEvent) => {
    event.preventDefault();
    if (username === '') {
      setAlertContent({ messageI18nKey: 'username_input_helper_text_empty', severity: 'error', alertOpen: true });
      return;
    }
    if (password === '') {
      setAlertContent({ messageI18nKey: 'password_input_helper_text_empty', severity: 'error', alertOpen: true });
      return;
    }

    loginMutation.mutate({ username, password, isJams });
  };

  return (
    <>
      <ProcessingRequest open={isLoading} />

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
