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

import { Modal } from '@mui/material'

interface MediaViewerProps {
  blobUrl: string
  open: boolean
  onClose: () => void
}

export default function MediaViewer({ blobUrl, open, onClose }: MediaViewerProps) {
  return (
    <Modal
      onClose={onClose}
      open={open}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '10px' }}
    >
      <img
        src={blobUrl}
        alt="media"
        style={{ maxWidth: '90%', maxHeight: '90%', border: 'none', borderRadius: '10px' }}
      />
    </Modal>
  )
}
