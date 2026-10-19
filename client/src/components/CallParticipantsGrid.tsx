/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
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
import { Box, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { useCallManagerContext } from '../contexts/CallManagerProvider.js'
import VideoStream from './VideoStream.js'

type CallParticipantsGridProps = {
  // What this account sends: its camera or its screen, if any.
  localStream: MediaStream | undefined
  audioOutDeviceId: string | undefined
}

// Every participant of a group call, this account included, in tiles of the same size.
const CallParticipantsGrid = ({ localStream, audioOutDeviceId }: CallParticipantsGridProps) => {
  const { t } = useTranslation()
  const { remoteParticipants, callMembers } = useCallManagerContext()

  const names = useMemo(
    () => new Map(callMembers?.map((member) => [member.contact.uri, member.getDisplayName()])),
    [callMembers],
  )
  const tileCount = remoteParticipants.length + 1
  const columns = Math.ceil(Math.sqrt(tileCount))
  const rows = Math.ceil(tileCount / columns)

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        gap: 1,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {remoteParticipants.map(({ uri, stream }) => (
        <CallParticipantTile
          key={uri}
          name={names.get(uri) ?? uri}
          stream={stream}
          audioOutDeviceId={audioOutDeviceId}
        />
      ))}
      <CallParticipantTile name={t('yourself')} stream={localStream} muted />
    </Box>
  )
}

type CallParticipantTileProps = {
  name: string
  stream: MediaStream | undefined
  audioOutDeviceId?: string
  muted?: boolean
}

const CallParticipantTile = ({ name, stream, audioOutDeviceId, muted }: CallParticipantTileProps) => (
  <Box
    component="figure"
    sx={{ position: 'relative', margin: 0, overflow: 'hidden', borderRadius: 2, backgroundColor: 'grey.900' }}
  >
    {stream && (
      // Each participant's tile plays its sound too: there is no other element for it.
      <VideoStream
        stream={stream}
        audioOutDeviceId={audioOutDeviceId}
        muted={muted}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    )}
    <Typography
      component="figcaption"
      variant="body2"
      noWrap
      title={name}
      sx={{
        position: 'absolute',
        left: (theme) => theme.spacing(1),
        bottom: (theme) => theme.spacing(1),
        maxWidth: (theme) => `calc(100% - ${theme.spacing(2)})`,
        paddingX: 1,
        borderRadius: 1,
        color: 'white',
        backgroundColor: '#00000088',
      }}
    >
      {name}
    </Typography>
  </Box>
)

export default CallParticipantsGrid
