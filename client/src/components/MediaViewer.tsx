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

import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import LinkIcon from '@mui/icons-material/Link'
import { Box, Modal, useMediaQuery, useTheme } from '@mui/material'

import { ConversationMember } from '../models/conversation-member'
import ConversationAvatar from './ConversationAvatar'
import EllipsisMiddle from './EllipsisMiddle'

interface MediaViewerProps {
  fileName?: string
  blobUrl: string
  open: boolean
  onClose: () => void
  member?: ConversationMember
  handleDownload?: () => void
}

export default function MediaViewer({ fileName, blobUrl, open, onClose, member, handleDownload }: MediaViewerProps) {
  const theme = useTheme()
  const isMedium = useMediaQuery(theme.breakpoints.down('sm'))
  const isXs = useMediaQuery(theme.breakpoints.down(400))

  return (
    <Modal
      onClose={onClose}
      open={open}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      }}
    >
      <>
        {member && (
          <Box sx={{ position: 'absolute', top: '0', left: '0', padding: '20px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: '8px' }}>
              <ConversationAvatar
                displayName={member?.getDisplayName() || member.contact.registeredName || member.contact.uri}
                contactUri={member.contact.uri}
              />
              <Box>
                <Box sx={{ color: 'white', fontWeight: 'bold' }}>
                  {isMedium ? (
                    <Box sx={{ maxWidth: isXs ? '150px' : '200px' }}>
                      <EllipsisMiddle text={member.getDisplayName()} />
                    </Box>
                  ) : (
                    member.getDisplayName()
                  )}
                </Box>
                {member.contact.uri !== member.getDisplayName() && (
                  <Box maxWidth={isMedium ? '115px' : '160px'} sx={{ color: 'white', fontSize: '11px' }}>
                    {isMedium ? <EllipsisMiddle text={member.contact.uri} /> : member.contact.uri}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}

        <Box sx={{ position: 'absolute', top: '0', right: '0', padding: '20px', pr: isMedium ? '10px' : '40px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: isXs ? '8px' : '16px' }}>
            <LinkIcon
              sx={{ height: '30px', width: '30px', color: 'white', ':hover': { cursor: 'pointer' } }}
              onClick={() => window.open(blobUrl)}
            />
            {handleDownload && (
              <DownloadIcon
                sx={{ height: '30px', width: '30px', color: 'white', ':hover': { cursor: 'pointer' } }}
                onClick={handleDownload}
              />
            )}
            <CloseIcon
              sx={{ height: '30px', width: '30px', color: 'white', ':hover': { cursor: 'pointer' } }}
              onClick={onClose}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            alignContent: 'center',
            height: '100%',
            width: '100%',
            marginTop: '50px',
          }}
        >
          <img
            src={blobUrl}
            alt="media"
            style={{
              maxWidth: '90%',
              maxHeight: isMedium ? '80%' : '80%',
              border: 'none',
              borderRadius: '10px',
              marginTop: '10px',
            }}
          />

          {fileName && (
            <Box sx={{ textAlign: 'center', color: 'white', marginTop: '10px', maxWidth: '85%' }}>
              {(isMedium && fileName.length > 30) || fileName.length > 150 ? (
                <EllipsisMiddle text={fileName} />
              ) : (
                fileName
              )}
            </Box>
          )}
        </Box>
      </>
    </Modal>
  )
}
