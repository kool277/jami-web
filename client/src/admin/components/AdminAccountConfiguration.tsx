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
import Fingerprint from '@mui/icons-material/Fingerprint'
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import BaseButton from '../../components/common/BaseButton.js'
import { PasswordInput } from '../../components/Input.js'
import LayoutSettings from '../../components/LayoutSettings.js'
import { DeleteIcon } from '../../components/SvgIcon.js'
import {
  useAdminDeletePasskeyMutation,
  useAdminPasskeyCredentialsQuery,
  useAdminRegisterPasskeyMutation,
  useUpdateAdminPasswordMutation,
} from '../services/adminQueries.js'

export default function AuthMethods() {
  const { t } = useTranslation()
  const [oldPassword, setOldPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [repeatPassword, setRepeatPassword] = useState<string>('')

  const passwordMutation = useUpdateAdminPasswordMutation()

  function validatePasswordChange() {
    if (
      newPassword !== repeatPassword ||
      oldPassword === newPassword ||
      newPassword === '' ||
      repeatPassword === '' ||
      oldPassword === ''
    ) {
      return
    }
    passwordMutation.mutate({ old: oldPassword, new: newPassword })
    setOldPassword('')
    setNewPassword('')
    setRepeatPassword('')
  }

  function onOldPasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setOldPassword(event.target.value)
  }

  function onNewPasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setNewPassword(event.target.value)
  }

  function onRepeatPasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    setRepeatPassword(event.target.value)
  }

  return (
    <>
      <LayoutSettings title={t('setting_change_admin_password')} text={t('setting_change_admin_password_text')}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <AnimatePresence>
            <motion.div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignContent: 'center',
              }}
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              exit={{ x: 20 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <PasswordInput
                  value={oldPassword}
                  onChange={onOldPasswordChange}
                  placeholder={t('admin_page_password_old_placeholder')}
                  tooltipTitle={t('admin_page_password_old_placeholder')}
                  newPlaceHolder={t('admin_page_password_old_placeholder')}
                />
                <PasswordInput
                  value={newPassword}
                  onChange={onNewPasswordChange}
                  placeholder={t('admin_page_password_placeholder')}
                  tooltipTitle={t('admin_page_password_placeholder')}
                  newPlaceHolder={t('admin_page_password_placeholder')}
                />
                <PasswordInput
                  value={repeatPassword}
                  onChange={onRepeatPasswordChange}
                  placeholder={t('admin_page_password_repeat_placeholder')}
                  tooltipTitle={t('admin_page_password_repeat_placeholder')}
                  newPlaceHolder={t('admin_page_password_repeat_placeholder')}
                />
                <Box
                  sx={{
                    fontSize: '11px',
                    color: '#CC0022',
                    visibility:
                      newPassword !== repeatPassword && newPassword !== '' && repeatPassword !== ''
                        ? 'visible'
                        : 'hidden',
                  }}
                >
                  {t('password_input_helper_text_not_match')}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: '10%' }}>
                  <BaseButton
                    variant="contained"
                    type="submit"
                    onClick={validatePasswordChange}
                    disabled={
                      oldPassword === '' ||
                      newPassword === '' ||
                      repeatPassword === '' ||
                      newPassword !== repeatPassword ||
                      oldPassword === newPassword
                    }
                  >
                    {t('admin_page_password_submit')}
                  </BaseButton>
                </Box>
              </Box>
            </motion.div>
          </AnimatePresence>
        </Box>
      </LayoutSettings>

      {browserSupportsWebAuthn() && <AdminPasskeySection />}
    </>
  )
}

function AdminPasskeySection() {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [passkeyName, setPasskeyName] = useState('')

  const { data: passkeys, isLoading } = useAdminPasskeyCredentialsQuery()
  const registerMutation = useAdminRegisterPasskeyMutation()
  const deleteMutation = useAdminDeletePasskeyMutation()

  const handleRegister = async () => {
    await registerMutation.mutateAsync(passkeyName || 'Passkey')
    setDialogOpen(false)
    setPasskeyName('')
  }

  return (
    <LayoutSettings title={t('passkey_section_title')} text={t('passkey_section_description')}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {isLoading ? null : passkeys && passkeys.length > 0 ? (
          <List dense sx={{ width: '100%', maxWidth: 400 }}>
            {passkeys.map((pk) => (
              <ListItem key={pk.credentialId}>
                <ListItemIcon>
                  <Fingerprint />
                </ListItemIcon>
                <ListItemText
                  primary={pk.name}
                  secondary={t('passkey_registered_on', {
                    date: new Date(pk.createdAt).toLocaleDateString(),
                  })}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => deleteMutation.mutate(pk.credentialId)}
                    disabled={deleteMutation.isPending}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            {t('passkey_no_credentials')}
          </Typography>
        )}

        <BaseButton
          variant="outlined"
          startIcon={<Fingerprint />}
          onClick={() => setDialogOpen(true)}
          disabled={registerMutation.isPending}
          sx={{ mt: 1 }}
        >
          {t('passkey_register_button')}
        </BaseButton>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{t('passkey_register_button')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('passkey_name_label')}
            placeholder={t('passkey_name_placeholder')}
            fullWidth
            value={passkeyName}
            onChange={(e) => setPasskeyName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <BaseButton variant="text" onClick={() => setDialogOpen(false)}>
            {t('cancel')}
          </BaseButton>
          <BaseButton onClick={handleRegister} disabled={registerMutation.isPending} variant="contained">
            {t('passkey_register_button')}
          </BaseButton>
        </DialogActions>
      </Dialog>
    </LayoutSettings>
  )
}
