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

import { Box, Button, Menu, MenuItem } from '@mui/material';
import { MouseEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useAuthContext } from '../contexts/AuthProvider';

type NavigateURL = '/' | '/contacts' | '/settings-account' | '/settings-general';

export default function Header() {
  const { t } = useTranslation();
  const { logout } = useAuthContext();

  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const closeMenuAndNavigate = (navigateUrl?: NavigateURL) => {
    setAnchorEl(null);
    if (navigateUrl) {
      navigate(navigateUrl);
    }
  };

  return (
    <Box>
      <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
        {t('Menu')}
      </Button>
      <Menu id="simple-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => closeMenuAndNavigate()}>
        <MenuItem onClick={() => closeMenuAndNavigate(`/`)}>{t('conversations')}</MenuItem>
        <MenuItem onClick={() => closeMenuAndNavigate(`/contacts`)}>{t('settings_menu_item_contacts')}</MenuItem>
        <MenuItem onClick={() => closeMenuAndNavigate('/settings-account')}>{t('settings_menu_item_account')}</MenuItem>
        <MenuItem onClick={() => closeMenuAndNavigate('/settings-general')}>{t('settings_menu_item_general')}</MenuItem>
        <MenuItem onClick={logout}>{t('logout')}</MenuItem>
      </Menu>
    </Box>
  );
}
