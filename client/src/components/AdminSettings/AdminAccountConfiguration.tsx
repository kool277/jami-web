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
import { Box, Button, Input, Typography } from '@mui/material'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function AuthMethods() {
  const { t } = useTranslation()
  const [oldPassword, setOldPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [repeatPassword, setRepeatPassword] = useState<string>('')

  function validatePasswordChange() {
    console.log('validate')
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
    <Box
      sx={{ marginTop: '10%', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      <Typography variant="h5" sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
        {' '}
        {t('setting_change_admin_password')}{' '}
      </Typography>
      <AnimatePresence>
        <motion.div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignContent: 'center',
            marginTop: '2%',
          }}
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          exit={{ x: 20 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Input
              type="password"
              value={oldPassword}
              onChange={onOldPasswordChange}
              placeholder={t('admin_page_password_old_placeholder')}
            ></Input>
            <Input
              type="password"
              value={newPassword}
              onChange={onNewPasswordChange}
              placeholder={t('admin_page_password_placeholder')}
            ></Input>
            {newPassword !== repeatPassword && newPassword !== '' && repeatPassword !== '' && (
              <Box sx={{ fontSize: '11px', color: '#CC0022' }}>{t('password_input_helper_text_not_match')}</Box>
            )}
            <Input
              type="password"
              value={repeatPassword}
              onChange={onRepeatPasswordChange}
              placeholder={t('admin_page_password_repeat_placeholder')}
            ></Input>
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: '10%' }}>
              <Button
                variant="contained"
                type="submit"
                onClick={validatePasswordChange}
                disabled={
                  oldPassword === '' || newPassword === '' || repeatPassword === '' || newPassword !== repeatPassword
                }
              >
                {t('admin_page_password_submit')}
              </Button>
            </Box>
          </Box>
        </motion.div>
      </AnimatePresence>
    </Box>
  )
}
