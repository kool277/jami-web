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
import Check from '@mui/icons-material/Check'
import RefreshOutlined from '@mui/icons-material/RefreshOutlined'
import { Avatar, AvatarProps, Box, Dialog, Stack, Typography, useTheme } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'

import { useAuthContext } from '../contexts/AuthProvider'
import CallPermissionDenied from '../pages/CallPermissionDenied'
import { useUpdateAvatarMutation } from '../services/accountQueries'
import { useContactProfilePicture } from '../services/contactQueries'
import { FileHandler } from '../utils/files'
import { getColor } from '../utils/messagecolor'
import {
  CancelPictureButton,
  CloseButton,
  CornerCloseButton,
  EditPictureButton,
  RecordButton,
  RoundButton,
  TakePictureButton,
  UploadPictureButton,
} from './Button'
import { InfosDialog, useDialogHandler } from './Dialog'
import { CircleMaskOverlay, FileDragOverlay } from './Overlay'

type ConversationAvatarProps = AvatarProps & {
  displayName: string
  contactUri: string
}

export default function ConversationAvatar({ displayName, contactUri, ...props }: ConversationAvatarProps) {
  const profilePictureQuery = useContactProfilePicture(contactUri)
  const url = profilePictureQuery.data
  const src = props.src || url || '/broken'
  const color = getColor(contactUri ? 'jami:' + contactUri : '')
  delete props.src

  useEffect(() => {
    const updatedSrc = props.src || url || '/broken'
    document.getElementById('avatar' + contactUri)?.setAttribute('src', updatedSrc)
  }, [contactUri, props.src, url])

  return (
    <Avatar
      id={'avatar' + contactUri}
      {...props}
      alt={displayName?.toUpperCase()}
      src={src}
      style={{ backgroundColor: color, color: '#E5E5E5' }}
    />
  )
}

export const AvatarEditor = () => {
  const { t } = useTranslation()
  const { account } = useAuthContext()
  const profilePictureQuery = useContactProfilePicture(account.getUri())
  const url = profilePictureQuery.data
  const [editionToolsIsOpen, setEditionToolsIsOpen] = useState(false)
  const [avatarHandler, setAvatarHandler] = useState<FileHandler | null>(null)
  const photoTakerHandler = useDialogHandler()
  const updateAvatarMutation = useUpdateAvatarMutation()
  const theme = useTheme()

  const onFilesDrop = useCallback(
    (acceptedFiles: File[]) => {
      const fileHandler = new FileHandler(acceptedFiles[0])
      setAvatarHandler(fileHandler)
      setEditionToolsIsOpen(false)
      const data = new FormData()
      data.append('avatar', fileHandler.file)
      updateAvatarMutation.mutate(data)
    },
    [updateAvatarMutation],
  )

  const {
    getRootProps,
    getInputProps,
    open: openFilePicker,
    isDragActive,
  } = useDropzone({
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpeg', '.jpg'],
    },
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDrop: onFilesDrop,
  })

  const openPhotoTaker = useCallback(() => {
    photoTakerHandler.openDialog()
    setEditionToolsIsOpen(false)
  }, [photoTakerHandler])

  const removeAvatar = useCallback(() => {
    setAvatarHandler(null)
    setEditionToolsIsOpen(false)
  }, [])

  const closeTools = useCallback(() => {
    setEditionToolsIsOpen(false)
  }, [])

  return (
    <Stack alignItems="center" position="relative" {...getRootProps()}>
      {isDragActive && <FileDragOverlay />}
      <input {...getInputProps()} />

      {/* Avatar preview */}
      <Stack height="150px" width="150px" position="relative">
        <Box sx={{ position: 'absolute', right: '19.89px', zIndex: 10 }}>
          <EditPictureButton onClick={() => setEditionToolsIsOpen(true)} sx={{ width: '30px', height: '30px' }} />
        </Box>
        <ConversationAvatar
          src={avatarHandler?.url || url}
          contactUri={account.getUri()}
          displayName={account.getDisplayName()}
          sx={{ width: '100%', height: '100%' }}
        />
      </Stack>

      {editionToolsIsOpen && (
        <Stack
          alignItems="center"
          justifyContent="center"
          position="absolute"
          height="200px"
          width="200px"
          zIndex={10}
          spacing={'26px'}
          sx={{
            backgroundColor: theme.ChatInterface.panelColor,
            borderRadius: '10px',
            boxShadow: '5px 5px 10px 0px #1f1f1f',
          }}
        >
          <Typography sx={{ fontSize: '23px' }}>{t('change_picture')}</Typography>
          <Stack direction="row" alignItems="center" spacing="9px">
            <TakePictureButton onClick={openPhotoTaker} />
            <UploadPictureButton onClick={openFilePicker} />
            {avatarHandler && <CancelPictureButton onClick={removeAvatar} />}
            <CloseButton onClick={closeTools} />
          </Stack>
        </Stack>
      )}

      <PhotoTakerDialog {...photoTakerHandler.props} onConfirm={setAvatarHandler} />
    </Stack>
  )
}

type PhotoTakerProps = {
  open: boolean
  onClose: () => void
  onConfirm: (photoHandler: FileHandler) => void
}

const circleLengthPercentage = '50%'
const PhotoTakerDialog = ({ open, onClose, onConfirm }: PhotoTakerProps) => {
  const [isPaused, setIsPaused] = useState(false)
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null) // video.srcObject is not reliable
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt')

  const videoRef = useCallback((node: HTMLVideoElement) => {
    setVideo(node)
  }, [])

  useEffect(() => {
    navigator.permissions
      // @ts-ignore
      // Firefox can't query camera permissions. Hopefully this will work soon.
      .query({ name: 'camera' })
      .then((permissionStatus) => {
        setPermissionState(permissionStatus.state)
        permissionStatus.onchange = () => {
          setPermissionState(permissionStatus.state)
          setStream(null)
        }
      })
      .catch(() => {
        // Expected behavior on Firefox
      })
  }, [])

  useEffect(() => {
    // Start stream when dialog opens, stop it when dialog closes
    if (open && !stream) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          setStream(stream)
          // This would be useless if we could query 'camera' permission on Firefox
          setPermissionState('granted')
        })
        .catch(() => {
          setStream(null)
          setPermissionState('denied')
        })
    }
    if (!open) {
      stream?.getTracks()?.forEach((track) => track.stop())
      setStream(null)
    }
  }, [open, stream, permissionState])

  useEffect(() => {
    if (video) {
      if (stream) {
        video.srcObject = stream
        video.play()
        setIsPaused(false)
      } else {
        video.srcObject = null
      }
    }
  }, [video, stream])

  const takePhoto = useCallback(() => {
    video?.pause()
    setIsPaused(true)
  }, [video])

  const cancelPhoto = useCallback(() => {
    video?.play()
    setIsPaused(false)
  }, [video])

  const savePhoto = useCallback(async () => {
    if (video) {
      // The PhotoTaker shows a circle in the middle of the camera's image.
      // We have to cut the picture, otherwise the avatar would be larger to what the user saw in boundaries of the circle
      // The circle's diameter is a percentage of the image's diagonal length
      const diagonalLength = Math.sqrt(Math.pow(video.offsetWidth, 2) + Math.pow(video.offsetHeight, 2))
      const avatarSize = diagonalLength * (parseInt(circleLengthPercentage) / 100)
      const xMargin = (video.offsetWidth - avatarSize) / 2
      const yMargin = (video.offsetHeight - avatarSize) / 2

      // @ts-ignore
      // Seems like Typescript does not know yet about OffscreenCanvas. Lets pretend it is HTMLCanvasElement for now
      const offscreenCanvas: HTMLCanvasElement = new OffscreenCanvas(avatarSize, avatarSize)
      const context = offscreenCanvas.getContext('2d')
      if (context) {
        context.setTransform(-1, 0, 0, 1, avatarSize, 0) // mirror
        context.drawImage(video, -xMargin, -yMargin, video.offsetWidth, video.offsetHeight)
        // @ts-ignore
        // convertToBlob is only on OffscreenCanvas, not HTMLCanvasElement, which has "toBlob" instead
        const blob: Blob = await offscreenCanvas.convertToBlob()
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        const fileHandler = new FileHandler(file)
        onConfirm(fileHandler)
        onClose()
      }
    }
  }, [onConfirm, onClose, video])

  if (permissionState === 'denied') {
    // TODO: UI needs to be improved
    return <InfosDialog title="" open={open} onClose={onClose} content={<CallPermissionDenied />} />
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <Stack>
        <Stack position="relative">
          <CornerCloseButton onClick={onClose} />
          {stream && <CircleMaskOverlay size={circleLengthPercentage} />}
          <video ref={videoRef} style={{ transform: 'rotateY(180deg)' /* mirror */ }} />
        </Stack>
        <Stack height="89px" direction="row" justifyContent="center" alignItems="center" spacing="10px">
          {isPaused ? (
            <>
              <RoundButton
                Icon={RefreshOutlined}
                aria-label="cancel photo"
                size="large"
                sx={{ fontSize: '40px' }}
                onClick={cancelPhoto}
              />
              <RoundButton
                Icon={Check}
                aria-label="save photo"
                size="large"
                sx={{ fontSize: '40px' }}
                onClick={savePhoto}
              />
            </>
          ) : (
            <RecordButton onClick={takePhoto} />
          )}
        </Stack>
      </Stack>
    </Dialog>
  )
}
