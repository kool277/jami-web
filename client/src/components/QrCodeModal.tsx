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
import { Box, Button, Modal } from '@mui/material'
import { QRCodeCanvas } from 'qrcode.react'
import { useState } from 'react'

import { Account } from '../models/account'
import { QrCodeIcon } from './SvgIcon'

interface QrCodeProps {
  account: Account
}

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'auto',
  height: 'auto',
  bgcolor: 'background.paper',
  border: '1px solid #000',
  borderRadius: '10px',
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}

const QrCodeModal = ({ account }: QrCodeProps) => {
  const [open, setOpen] = useState(false)
  const handleOpen = () => {
    setOpen(true)
  }
  const handleClose = () => {
    setOpen(false)
  }

  const qrCodeSize: number = 250

  return (
    <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'center' }}>
      <QrCodeIcon
        onClick={handleOpen}
        sx={{
          height: '30px',
          width: '30px',
          borderRadius: '5px',
          color: 'inherit',
          padding: '2px',
          ':hover': { cursor: 'pointer', backgroundColor: 'inherit' },
        }}
      />
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="parent-modal-title"
        aria-describedby="parent-modal-description"
      >
        <Box sx={{ ...style }}>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              flexWrap: 'nowrap',
              justifyContent: 'flex-end',
              mb: '2%',
            }}
          >
            <Button size="small" onClick={handleClose}>
              X
            </Button>
          </Box>

          <QRCodeCanvas style={{ borderRadius: '5px' }} size={qrCodeSize} value={account.getUri()} />
        </Box>
      </Modal>
    </div>
  )
}

export default QrCodeModal
