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

import { Avatar, AvatarProps, Box, Dialog, Stack, Typography, useTheme } from '@mui/material'
import { ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'

import { useAuthContext } from '../contexts/AuthProvider.js'
import { PresenceContext } from '../contexts/PresenceProvider.js'
import CallPermissionDenied from '../pages/CallPermissionDenied.js'
import { useUpdateAvatarMutation } from '../services/accountQueries.js'
import { useContactProfilePicture } from '../services/contactQueries.js'
import { FileHandler } from '../utils/files.js'
import { getColor } from '../utils/messagecolor.js'
import {
  CancelPictureButton,
  CloseButton,
  CornerCloseButton,
  EditPictureButton,
  RecordButton,
  RoundButton,
  TakePictureButton,
  UploadPictureButton,
} from './Button.js'
import { InfosDialog, useDialogHandler } from './Dialog.js'
import { CircleMaskOverlay, FileDragOverlay } from './Overlay.js'
import { CheckMarkIcon as Check, RefreshOutlinedIcon as RefreshOutlined } from './SvgIcon.js'

type ConversationAvatarProps = AvatarProps & {
  displayName: string
  contactUri: string
  presence?: boolean
}

export default function ConversationAvatar({ displayName, contactUri, presence, ...props }: ConversationAvatarProps) {
  const profilePictureQuery = useContactProfilePicture(contactUri)
  const url = profilePictureQuery.data
  const src = props.src || url || '/broken'
  const color = getColor(contactUri ? 'jami:' + contactUri : '')
  delete props.src

  useEffect(() => {
    const updatedSrc = props.src || url || '/broken'
    document.getElementById('avatar' + contactUri)?.setAttribute('src', updatedSrc)
  }, [contactUri, props.src, url])

  if (presence) {
    return (
      <ConversationAvatarPresence buddy={contactUri}>
        <Avatar
          id={'avatar' + contactUri}
          {...props}
          alt={displayName?.toUpperCase()}
          src={src}
          style={{ backgroundColor: color, color: '#E5E5E5' }}
        />
      </ConversationAvatarPresence>
    )
  }
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

const ConversationAvatarPresence = ({ children, buddy }: { children: ReactNode; buddy: string }) => {
  const theme = useTheme()
  const { getPresence } = useContext(PresenceContext)
  const presenceState = getPresence(buddy)

  if (!presenceState || presenceState === 0) {
    return children
  }

  const presenceIconSize = '12px'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: 'auto', height: 'auto' }}>
      {children}
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          justifyContent: 'flex-end',
          marginTop: '-7px',
          marginLeft: '-3px',
          zIndex: '100',
        }}
      >
        <Box
          sx={{
            width: presenceIconSize,
            height: presenceIconSize,
            backgroundColor: '#33cc33',
            borderRadius: '50%',
            border: '2px solid ' + theme.ChatInterface.panelColor,
          }}
        />
      </Box>
    </Box>
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

  const onPhotoConfirm = useCallback(
    (fileHandler: FileHandler) => {
      setAvatarHandler(fileHandler)
      const data = new FormData()
      data.append('avatar', fileHandler.file)
      updateAvatarMutation.mutate(data)
    },
    [updateAvatarMutation],
  )

  const removeAvatar = useCallback(() => {
    setAvatarHandler(null)
    setEditionToolsIsOpen(false)
  }, [])

  const closeTools = useCallback(() => {
    setEditionToolsIsOpen(false)
  }, [])

  return (
    <Stack
      {...getRootProps()}
      sx={{
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {isDragActive && <FileDragOverlay />}
      <input {...getInputProps()} />
      {/* Avatar preview */}
      <Stack
        sx={{
          height: '150px',
          width: '150px',
          position: 'relative',
        }}
      >
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
          spacing={'26px'}
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            height: '200px',
            width: '200px',
            zIndex: 10,
            backgroundColor: theme.ChatInterface.panelColor,
            borderRadius: '10px',
            boxShadow: '5px 5px 10px 0px #1f1f1f',
          }}
        >
          <Typography sx={{ fontSize: '23px' }}>{t('change_picture')}</Typography>
          <Stack
            direction="row"
            spacing="9px"
            sx={{
              alignItems: 'center',
            }}
          >
            <TakePictureButton onClick={openPhotoTaker} />
            <UploadPictureButton onClick={openFilePicker} />
            {avatarHandler && <CancelPictureButton onClick={removeAvatar} />}
            <CloseButton onClick={closeTools} />
          </Stack>
        </Stack>
      )}
      <PhotoTakerDialog {...photoTakerHandler.props} onConfirm={onPhotoConfirm} />
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
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null) // video.srcObject is not reliable
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt')

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node
  }, [])

  useEffect(() => {
    navigator.permissions
      // @ts-ignore
      // Firefox is unable to query camera permissions. Hopefully this will work soon.
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
          setIsPaused(false)
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
      void Promise.resolve().then(() => setStream(null))
    }
  }, [open, stream, permissionState])

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      if (stream) {
        video.srcObject = stream
        video.play()
      } else {
        video.srcObject = null
      }
    }
  }, [stream])

  const takePhoto = useCallback(() => {
    const video = videoRef.current
    video?.pause()
    setIsPaused(true)
  }, [])

  const cancelPhoto = useCallback(() => {
    const video = videoRef.current
    video?.play()
    setIsPaused(false)
  }, [])

  const savePhoto = useCallback(async () => {
    const video = videoRef.current
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
  }, [onConfirm, onClose])

  if (permissionState === 'denied') {
    // TODO: UI needs to be improved
    return <InfosDialog title="" open={open} onClose={onClose} content={<CallPermissionDenied />} />
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <Stack>
        <Stack
          sx={{
            position: 'relative',
          }}
        >
          <CornerCloseButton onClick={onClose} />
          {stream && <CircleMaskOverlay size={circleLengthPercentage} />}
          <video ref={setVideoRef} style={{ transform: 'rotateY(180deg)' /* mirror */ }} />
        </Stack>
        <Stack
          direction="row"
          spacing="10px"
          sx={{
            height: '89px',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
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
