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
import { ChangeEvent, FormEvent, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Link, useNavigate } from 'react-router-dom';

import { NameStatus, PasswordInput, PasswordStatus, UsernameInput } from '../components/Input';
import ProcessingRequest from '../components/ProcessingRequest';
import withAuthUI from '../components/WithAuthUI';
import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider';
import {
  checkIfUserameIsRegistered,
  checkPasswordStrength,
  loginUser,
  registerUser,
  setAccessToken,
} from '../utils/auth';
import { inputWidth, jamiUsernamePattern } from '../utils/constants';
function RegistrationForm() {
  const theme: Theme = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isJams, setIsJams] = useState<boolean>(false);

  const [usernameStatus, setUsernameStatus] = useState<NameStatus>('default');
  const [passwordStatus, setPasswordStatus] = useState<PasswordStatus>('default');

  const { setAlertContent } = useContext(AlertSnackbarContext);

  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'));

  useEffect(() => {
    let timetoutId: ReturnType<typeof setTimeout>;
    if (usernameStatus === 'valid') {
      timetoutId = setTimeout(() => {
        // useCheckIfUsernameIsRegisteredMutation.mutate(username);
        checkIfUserameIsRegistered(username)
          .then((response) => {
            //server responds 200 if name IS found
            if (response.status === HttpStatusCode.Ok) {
              setUsernameStatus('taken');
            }
          })
          .catch((e) => {
            // console.log(e.response.data);
            const { status } = e.response;
            if (status === HttpStatusCode.BadRequest) {
              //TODO: server sends invalid username as the message, add it to the locale
              // console.log(e.response.data);
              setUsernameStatus('invalid');
            } else if (status === HttpStatusCode.NotFound) {
              //TODO: server didn't find this username, therefore it can be registered, add the message to the locale
              // console.log(e.response.data);
              setUsernameStatus('success');
            } else {
              setAlertContent({ messageI18nKey: 'unknown_error_alert', severity: 'error', alertOpen: true });
            }
          });
      }, 1000);
    }

    return () => {
      clearTimeout(timetoutId);
    };
  }, [t, username, usernameStatus, setAlertContent]);

  const login = () => {
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
          // setAlertContent(t('unknown_error_alert'));
        } else if (status === HttpStatusCode.NotFound) {
          //TODO: there are two different not found responses that could be returned by the server, use message to differentiate them?
          console.log(e.response.data);
          // setAlertContent(t('login_username_not_found'));
        } else if (status === HttpStatusCode.Unauthorized) {
          setAlertContent({ messageI18nKey: 'login_invalid_password', severity: 'error', alertOpen: true });
        } else {
          setAlertContent({ messageI18nKey: 'unknown_error_alert', severity: 'error', alertOpen: true });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const createAccount = () => {
    setLoading(true);
    registerUser(username, password, isJams)
      .then((response) => {
        if (response.status === HttpStatusCode.Created) {
          setAlertContent({ messageI18nKey: 'registration_success', severity: 'success', alertOpen: true });
          login();
        }
      })
      .catch((e) => {
        console.log(e);
        const { status } = e.response;
        if (status === HttpStatusCode.BadRequest) {
          //TODO: more than one bad request response defined in the server is missing credentials. add the response message to the locale.
          console.log(e.response.data);
          // setAlertContent(t('unknown_error_alert'));
        } else if (status === HttpStatusCode.Conflict) {
          //TODO: there are two different conflict responses that could be returned by the server, use message to differentiate them?
          console.log(e.response.data);
          // setAlertContent(t('login_username_not_found'));
        } else if (status === HttpStatusCode.Unauthorized) {
          //TODO: this is a response for JAMS, add message to the locale
        } else {
          setAlertContent({ messageI18nKey: 'unknown_error_alert', severity: 'error', alertOpen: true });
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleUsername = async (event: ChangeEvent<HTMLInputElement>) => {
    const usernameValue: string = event.target.value;
    setUsername(usernameValue);

    if (usernameValue === '') {
      setUsernameStatus('default');
      return;
    }

    if (!jamiUsernamePattern.test(usernameValue)) {
      setUsernameStatus('invalid');
      return;
    }
    //The valid state is when the username passes the Regex test and is ready for availability check.
    setUsernameStatus('valid');
  };

  const handlePassword = (event: ChangeEvent<HTMLInputElement>) => {
    const passwordValue: string = event.target.value;
    setPassword(passwordValue);

    if (passwordValue.length > 0) {
      const checkResult = checkPasswordStrength(passwordValue);
      setPasswordStatus(checkResult.valueCode);
    } else {
      setPasswordStatus('default');
    }
  };

  const handleIsJams = (event: ChangeEvent<HTMLInputElement>) => {
    setIsJams(event.target.value === 'jams');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const usernameOk = usernameStatus === 'success';
    const passwordOk = passwordStatus === 'strong';

    const canCreate = usernameOk && passwordOk;

    if (canCreate) {
      createAccount();
    } else {
      if (!usernameOk) {
        setUsernameStatus('registration_failed');
      }
      if (!passwordOk) {
        setPasswordStatus('registration_failed');
      }
    }
  };

  return (
    <>
      <ProcessingRequest open={loading} />

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
            {t('registration_form_title')}
          </Typography>
        </Box>

        <Form method="post" id="register-form">
          <div>
            <UsernameInput
              value={username}
              onChange={handleUsername}
              status={usernameStatus}
              tooltipTitle={t('registration_form_username_tooltip')}
              sx={{ width: theme.typography.pxToRem(inputWidth) }}
            />
          </div>
          <div>
            <PasswordInput
              value={password}
              onChange={handlePassword}
              status={passwordStatus}
              tooltipTitle={t('registration_form_password_tooltip')}
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
              <RadioGroup row onChange={handleIsJams} defaultValue="jami">
                <FormControlLabel value="jami" control={<Radio />} label={t('jami')} />
                <FormControlLabel value="jams" control={<Radio />} label={t('jams')} />
              </RadioGroup>
            </FormControl>
          </div>

          <Button
            variant="contained"
            type="submit"
            onClick={handleSubmit}
            sx={{ width: theme.typography.pxToRem(inputWidth), mt: theme.typography.pxToRem(20) }}
          >
            {t('registration_form_submit_button')}
          </Button>
        </Form>

        <Box sx={{ mt: theme.typography.pxToRem(50), mb: theme.typography.pxToRem(50) }}>
          <Typography variant="body1">
            {t('registration_form_to_login_text')} &nbsp;
            <Link to={'/login'}>{t('registration_form_to_login_link')}</Link>
          </Typography>
        </Box>
      </Stack>
    </>
  );
}

export default withAuthUI(RegistrationForm);
