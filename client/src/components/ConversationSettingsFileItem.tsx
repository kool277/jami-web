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

import AttachFileIcon from '@mui/icons-material/AttachFile'
import AudioFileIcon from '@mui/icons-material/AudioFile'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import VideoFileIcon from '@mui/icons-material/VideoFile'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import byteSize from 'byte-size'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useConversationContext } from '../contexts/ConversationProvider'
import { GetDownloadedFile, useGetAutoDownloadLimit, useGetDownloadFileInfo } from '../services/dataTransferQueries'
import EllipsisMiddle from './EllipsisMiddle'
import MediaViewer from './MediaViewer'

interface ConversationSettingsFileItemProps {
  displayName: string
  timeStamp: string
  totalSize: number
  fileId: string
  author: string
  messageId: string
}

const ConversationSettingsFileItem = ({
  displayName,
  timeStamp,
  totalSize,
  fileId,
  author,
  messageId,
}: ConversationSettingsFileItemProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { t } = useTranslation()
  const { members, conversationId } = useConversationContext()
  const limitData = useGetAutoDownloadLimit()

  const downloadFile = GetDownloadedFile(conversationId)
  const betterTotalSize = String(byteSize(totalSize))

  const [blobUrl, setBlobUrl] = useState<string | undefined>()
  const [blob, setBlob] = useState<Blob>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)

  const conversationMember = members.find((member) => member.contact.uri === author)
  const content = { messageId: messageId, fileId: fileId || '' }
  const isFileAlreadyInCache = useGetDownloadFileInfo({ content, conversationId })

  const extension = displayName.split('.').pop() || '' // get the extension of the file; This is not robust enough

  const getFileType = useCallback(() => {
    const fileTypes: { [key: string]: string } = {
      image: 'jpeg|jpg|gif|png|webp',
      video: 'mp4|webm|mov',
      audio: 'mp3|wav|ogg',
      text: 'txt|c|h|cpp|hpp|java|py|js|ts|css|sh|sql|php|json|xml|yml|yaml|ini|md|log|conf|tex|csv',
      pdf: 'pdf',
    }

    for (const [type, extensions] of Object.entries(fileTypes)) {
      if (new RegExp(`\\.(${extensions})$`).test(displayName)) {
        return type
      }
    }
    return 'none'
  }, [displayName])

  const getBlob = useCallback(
    async (type: string) => {
      try {
        const result = await downloadFile.mutateAsync({
          messageId,
          fileId,
        })

        if (!result) return

        const mimeType = type === 'pdf' ? 'application/pdf' : `${type}/${extension.toLowerCase()}`

        const blob = new Blob([result.blob], { type: mimeType })
        const url = URL.createObjectURL(blob)

        setBlob(blob)
        setBlobUrl(url)
        setIsDownloaded(true)

        return url
      } catch (error) {
        console.error('Failed to get blob:', error)
      }
    },
    [downloadFile, messageId, fileId, extension],
  )

  useEffect(() => {
    const shouldFetchBlob =
      limitData.isSuccess &&
      limitData.data &&
      isFileAlreadyInCache.isSuccess &&
      isFileAlreadyInCache.data &&
      !isDownloaded
    if (!shouldFetchBlob) return

    const totalSizeMb = totalSize / 1000000
    const isUnderSizeLimit = totalSizeMb < limitData.data.limit

    if (isUnderSizeLimit || isFileAlreadyInCache.data) {
      const fileType = getFileType()
      let isMounted = true

      getBlob(fileType).then((url) => {
        if (isMounted && url) {
          setIsDownloaded(true)
        }
      })

      return () => {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl)
        }
        isMounted = false
      }
    }
  }, [
    limitData.isSuccess,
    limitData.data,
    isFileAlreadyInCache.isSuccess,
    isFileAlreadyInCache.data,
    totalSize,
    isDownloaded,
    getBlob,
    getFileType,
    blobUrl,
  ])

  // only for video, img and audio files
  const handleDownload = async () => {
    // download the file on computer
    if (fileId === '') {
      return
    }
    if (blobUrl) {
      const link = document.createElement('a')
      link.href = blobUrl
      link.setAttribute('href', blobUrl)
      const fileName = displayName ? displayName : 'file'
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const result = await downloadFile.mutateAsync({ messageId: messageId, fileId: fileId || '' })
      if (!result) {
        return
      }
      const url = result.blobUrl
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('href', url)
      const fileName = displayName ? displayName : 'file'
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const iconStyle = { color: 'white', fontSize: '40px', width: '100%', padding: '4px' }

  const getIcon = () => {
    switch (getFileType()) {
      case 'image':
        return undefined
      case 'video':
        return <VideoFileIcon sx={iconStyle} />
      case 'audio':
        return <AudioFileIcon sx={iconStyle} />
      case 'pdf':
        return <PictureAsPdfIcon sx={iconStyle} />
      default:
        return <AttachFileIcon sx={iconStyle} />
    }
  }

  if (fileId === '') {
    return
  }

  return (
    <>
      <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box
          sx={{
            width: isMobile ? '70px' : '90px',
            height: isMobile ? '70px' : '90px',
            backgroundColor: 'grey',
            backgroundImage: `url(${blobUrl})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            borderRadius: '10px',
            ':hover': { cursor: 'pointer' },
            display: 'flex',
          }}
          onClick={() => {
            if (isDownloaded) {
              setIsModalOpen(true)
              return
            }
            getBlob(getFileType())
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignContent: 'center',
              alignItems: 'center',
              gap: '2px',
              width: '100%',
            }}
          >
            {getIcon()}

            {!(getFileType() === 'image' && isDownloaded) && (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    color: 'white',
                    fontSize: '10px',
                    width: '100%',
                    textAlign: 'center',
                    maxWidth: '100px',
                    flexWrap: 'nowrap',
                    justifyContent: 'center',
                    fontWeight: 'bolder',
                  }}
                >
                  {displayName.length > 15 ? <EllipsisMiddle text={displayName} /> : displayName}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    color: 'white',
                    fontSize: '10px',
                    width: '100%',
                    textAlign: 'center',
                    maxWidth: '90px',
                    flexWrap: 'nowrap',
                    justifyContent: 'center',
                  }}
                >
                  {betterTotalSize}
                </Box>
              </>
            )}
            {!isDownloaded && (
              <Box
                sx={{
                  display: 'flex',
                  color: 'white',
                  fontSize: '10px',
                  width: '100%',
                  textAlign: 'center',
                  maxWidth: '90px',
                  flexWrap: 'nowrap',
                  justifyContent: 'center',
                  marginTop: '-5px',
                }}
              >
                {t('click_to_download')}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      <MediaViewer
        timeStamp={timeStamp}
        handleDownload={handleDownload}
        fileName={displayName}
        totalSize={betterTotalSize}
        blob={blob}
        blobUrl={blobUrl || ''}
        member={conversationMember}
        open={isModalOpen}
        type={getFileType()}
        onClose={() => {
          setIsModalOpen(false)
        }}
      />
    </>
  )
}

export default ConversationSettingsFileItem
