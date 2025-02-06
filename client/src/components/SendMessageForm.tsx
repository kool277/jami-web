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
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Card, CardContent, TextareaAutosize, useTheme } from '@mui/material'
import { Stack, useMediaQuery } from '@mui/system'
import { WebSocketMessageType } from 'jami-web-common'
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useActionMessageReadContext, useActionMessageWriteContext } from '../contexts/ActionMessageProvider'
import { useAuthContext } from '../contexts/AuthProvider'
import { useConversationPreferencesColorContext } from '../contexts/ConversationPreferencesColorContext'
import { useConversationContext } from '../contexts/ConversationProvider'
import { useWebSocketContext } from '../contexts/WebSocketProvider'
import { ConversationMember } from '../models/conversation-member'
import { useEditMessageMutation, useSendMessageMutation } from '../services/conversationQueries'
import { useSendFilesMutation } from '../services/dataTransferQueries'
import { translateEnumeration, TranslateEnumerationOptions } from '../utils/translations'
import {
  RecordVideoMessageButton,
  RecordVoiceMessageButton,
  SelectEmojiButton,
  SendMessageButton,
  UploadFileButton,
} from './Button'

interface SendMessageFormProps {
  openFilePicker: () => void
}

export default function SendMessageForm({ openFilePicker }: SendMessageFormProps) {
  const webSocket = useWebSocketContext()
  const { members, conversationId } = useConversationContext()
  const [currentMessage, setCurrentMessage] = useState('')
  const composingNotificationTimeRef = useRef(0)
  const placeholder = usePlaceholder(members)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [firstTime, setFirstTime] = useState(-1)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const waveformDataRef = useRef<Array<{ data: Uint8Array; progress: number }>>([])
  const frameCountRef = useRef<number>(0)
  const scrollOffsetRef = useRef<number>(0)
  const { conversationColor } = useConversationPreferencesColorContext()
  const { editMessage, replyMessage: selectedReply, fileHandlers } = useActionMessageReadContext()
  const {
    setEditMessage: setIsEditing,
    setReplyMessage: setSelectedReply,
    setFileHandlers,
  } = useActionMessageWriteContext()

  const sendMessageMutation = useSendMessageMutation(conversationId)
  const editMessageMutation = useEditMessageMutation(conversationId)
  const sendFilesMutation = useSendFilesMutation(conversationId)

  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const isMedium: boolean = useMediaQuery(theme.breakpoints.only('sm'))
  const isMoreThanMedium: boolean = useMediaQuery(theme.breakpoints.up('md'))
  const isReduced = isMobile || isMedium

  useEffect(() => {
    setCurrentMessage(editMessage?.body || '')
  }, [editMessage])

  const sendMessage = useCallback(
    (message: string) => {
      if (message !== 'files-to-send') {
        sendMessageMutation.mutate(JSON.stringify({ message, replyTo: selectedReply?.id }))
      }

      const data: FormData = new FormData()
      for (const file of fileHandlers) {
        data.append('file', file.file)
      }

      data.append('replyTo', selectedReply?.id || '')
      sendFilesMutation.mutate(data)
      setFileHandlers([])
    },
    [fileHandlers, selectedReply?.id, sendFilesMutation, sendMessageMutation, setFileHandlers],
  )

  const editMessageHandler = useCallback(
    (message: string) => {
      editMessageMutation.mutate(JSON.stringify({ message, messageId: editMessage?.id }))
    },
    [editMessage?.id, editMessageMutation],
  )

  const handleSendMessage = useCallback(
    (message: string, audioFile?: File) => {
      if (message === 'audio-message') {
        if (audioFile) {
          const data: FormData = new FormData()
          data.append('file', audioFile)
          data.append('replyTo', selectedReply?.id || '')
          sendFilesMutation.mutate(data)
        }
        setSelectedReply(undefined)
        return
      }
      if (editMessage) {
        editMessageHandler(message)
        setSelectedReply(undefined)
        return
      }
      sendMessage(message)
      setSelectedReply(undefined)
      setIsEditing(undefined)
      setFileHandlers([])
    },
    [
      editMessage,
      editMessageHandler,
      selectedReply?.id,
      sendFilesMutation,
      sendMessage,
      setFileHandlers,
      setIsEditing,
      setSelectedReply,
    ],
  )

  const notifyComposing = useCallback(() => {
    const currentTime = new Date().getTime()
    // The daemon automatically turns off "isComposing" after 12 seconds
    // We ensure it will stay on at least 4 seconds after the last typed character
    if (currentTime - composingNotificationTimeRef.current > 8000) {
      composingNotificationTimeRef.current = currentTime
      webSocket.send(WebSocketMessageType.ComposingStatus, { conversationId, isWriting: true })
    }
  }, [webSocket, conversationId])

  const notifyStopcomposing = useCallback(() => {
    composingNotificationTimeRef.current = 0
    webSocket?.send(WebSocketMessageType.ComposingStatus, { conversationId, isWriting: false })
  }, [webSocket, conversationId])

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (currentMessage) {
        handleSendMessage(currentMessage)
        setCurrentMessage('')
        notifyStopcomposing()
      }
      if (fileHandlers.length > 0 && currentMessage === '') {
        handleSendMessage('files-to-send')
      }
    },
    [currentMessage, fileHandlers.length, handleSendMessage, notifyStopcomposing],
  )

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentMessage(event.target.value)
    notifyComposing()
  }

  const onEmojiSelected = (emoji: string) => setCurrentMessage((currentMessage) => currentMessage + emoji)

  const handleVoiceRecording = () => {
    setIsRecordingVoice((isRecordingVoice) => !isRecordingVoice)
    stopRecording(false)
  }

  const voiceRecordingStatusChange = () => {
    if (isRecordingVoice) {
      stopRecording(true)
    } else {
      startRecording()
      setFileHandlers([])
      setCurrentMessage('')
    }
    setIsRecordingVoice((isRecordingVoice) => !isRecordingVoice)
  }

  const sendAudioMessage = useCallback(() => {
    const blob = new Blob(chunksRef.current, { type: 'audio/ogg; codecs=opus' })
    const file = new File([blob], 'voicemessage.ogg', { type: 'audio/ogg; codecs=opus' })
    handleSendMessage('audio-message', file)
  }, [handleSendMessage])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioContextRef.current = new window.AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      analyserRef.current.fftSize = 2048
      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)

      chunksRef.current = []
      mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data)
      mediaRecorderRef.current.onstop = () => {
        sendAudioMessage()
      }

      mediaRecorderRef.current.start()
      setCurrentTime(0)
      setStartTime(0)
      setFirstTime(-1)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }, [sendAudioMessage])

  const stopRecording = useCallback(
    (isCancel: boolean) => {
      if (mediaRecorderRef.current && isRecordingVoice) {
        if (isCancel) {
          mediaRecorderRef.current.onstop = null
        }
        setCurrentTime(0)
        setStartTime(0)
        setFirstTime(-1)
        mediaRecorderRef.current.stop()

        // stop and reset animation
        frameCountRef.current = 0
        waveformDataRef.current = []
        scrollOffsetRef.current = 0

        const tracks = mediaRecorderRef.current.stream.getTracks()
        tracks.forEach((track) => track.stop())
      }
    },
    [isRecordingVoice],
  )

  useEffect(() => {
    let animationFrameId: number

    const draw = (timestamp: number) => {
      if (startTime === null || startTime === undefined) setStartTime(timestamp)
      const calculatedTime = (timestamp - startTime) / 1000
      if (calculatedTime > 0 && firstTime === -1) setFirstTime(calculatedTime)
      setCurrentTime(calculatedTime - firstTime)

      const canvas = canvasRef.current
      if (canvas === null) return
      const ctx = canvas.getContext('2d')
      const width = canvas.width
      const height = canvas.height

      if (analyserRef.current === null || dataArrayRef.current === null) {
        return
      }
      analyserRef.current.getByteFrequencyData(dataArrayRef.current)

      frameCountRef.current++
      if (frameCountRef.current % 8 === 0) {
        waveformDataRef.current.push({
          data: new Uint8Array(dataArrayRef.current),
          progress: 0,
        } as never)
      }

      if (ctx === null) {
        console.error('Canvas context is null')
        return
      }
      ctx.clearRect(0, 0, width, height)
      const barWidth = 5
      const gap = 3
      const amp = height * 0.9
      const minBarHeight = height * 0.15

      ctx.fillStyle = 'rgb(255, 255, 255)'

      let totalWidth = 0
      waveformDataRef.current.forEach((item: { progress: number; data: Uint8Array }) => {
        const x = totalWidth - scrollOffsetRef.current
        const rawBarHeight = (item.data[0] / 255) * amp
        const accentuatedHeight = Math.pow(rawBarHeight / amp, 0.5) * amp
        const barHeight = Math.max(minBarHeight, accentuatedHeight * item.progress)
        const y = height / 2 - barHeight / 2

        if (x + barWidth > 0 && x < width) {
          drawRoundedBar(ctx, x, y, barWidth, barHeight)
        }
        totalWidth += barWidth + gap
        item.progress = Math.min(item.progress + 0.2, 1)
      })

      if (totalWidth > width) {
        scrollOffsetRef.current += 0.3
        if (scrollOffsetRef.current >= barWidth + gap) {
          waveformDataRef.current.shift()
          scrollOffsetRef.current -= barWidth + gap
        }
      }

      if (isRecordingVoice) {
        animationFrameId = requestAnimationFrame(draw)
      }
    }

    const drawRoundedBar = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
      const radius = Math.min(width / 2, 2)
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + width - radius, y)
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
      ctx.lineTo(x + width, y + height - radius)
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
      ctx.lineTo(x + radius, y + height)
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()
    }

    if (isRecordingVoice) {
      animationFrameId = requestAnimationFrame(draw)
    }
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isRecordingVoice, currentTime, startTime, firstTime])

  function getAudioWavePercentageWidth() {
    if (isMobile) {
      return '100%'
    } else if (isMedium) {
      return '90%'
    } else if (isMoreThanMedium) {
      return '80%'
    }
    return '70%'
  }

  function getAudioWavePixelWidth() {
    if (isMobile || isMedium) {
      return 100
    } else if (isMoreThanMedium) {
      return 400
    }
    return 700
  }

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: conversationColor,
    borderRadius: '15px',
    padding: '7px 20px',
    width: getAudioWavePercentageWidth(),
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  }

  const waveformContainerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    overflow: 'hidden',
    flexGrow: 1,
    margin: '0 10px',
    position: 'relative',
    width: '100%',
  }

  const durationStyles: React.CSSProperties = {
    color: 'white',
    fontSize: '14px',
    marginLeft: '10px',
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const mobileOptionStyles = {
    ml: '-3px',
    mr: '-3px',
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      setCurrentMessage((prev) => prev + '\n')
    } else if (event.key === 'Enter') {
      event.preventDefault()
      handleSubmit(new Event('submit') as unknown as FormEvent<HTMLFormElement>)
    }
  }

  return (
    <Stack
      component="form"
      onSubmit={handleSubmit}
      direction="row"
      alignItems="center"
      spacing="5px"
      paddingX="8px"
      marginBottom="-8px"
    >
      <Box sx={{ display: 'flex' }}>
        <RecordVoiceMessageButton
          sx={isReduced ? mobileOptionStyles : {}}
          onClick={voiceRecordingStatusChange}
          disabled={editMessage || isRecordingVoice ? true : false}
        />
        <RecordVideoMessageButton
          sx={isReduced ? mobileOptionStyles : {}}
          disabled={editMessage || isRecordingVoice ? true : false}
        />
        <UploadFileButton
          sx={isReduced ? mobileOptionStyles : {}}
          disabled={editMessage || isRecordingVoice ? true : false}
          onClick={openFilePicker}
        />
      </Box>
      {isRecordingVoice ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <div style={containerStyles}>
            <div style={waveformContainerStyles}>
              {/* canvas not responsible for now */}
              <canvas ref={canvasRef} width={getAudioWavePixelWidth()} height={30} style={{ display: 'block' }} />
            </div>
            <span style={durationStyles}>{formatTime(currentTime)}</span>
          </div>
        </Box>
      ) : (
        <Card variant="elevation" sx={{ width: '100%', borderRadius: '10px', minWidth: '100px' }}>
          <CardContent
            sx={{
              width: '100%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              padding: '10px',
            }}
          >
            <Stack flexGrow={1}>
              <TextareaAutosize
                value={currentMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                maxRows={4}
                style={{
                  font: 'inherit',
                  fontSize: '14px',
                  width: '100%',
                  resize: 'none',
                  border: 'none',
                  outline: 'none',
                  overflowY: 'auto',
                  backgroundColor: 'transparent',
                  textAlign: 'start',
                  marginBottom: '-12px',
                  whiteSpace: currentMessage ? 'pre-wrap' : 'nowrap',
                  textOverflow: currentMessage ? 'clip' : 'ellipsis',
                }}
              />
            </Stack>
          </CardContent>
        </Card>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', alignContent: 'center' }}>
        {isRecordingVoice ? (
          <DeleteIcon
            onClick={voiceRecordingStatusChange}
            style={{ color: 'red', width: '30px', height: '30px', cursor: 'pointer' }}
          />
        ) : (
          <SelectEmojiButton onEmojiSelected={onEmojiSelected} />
        )}
        <SendMessageButton
          sx={{ ml: '4px' }}
          disabled={!(currentMessage || fileHandlers.length > 0) && !isRecordingVoice}
          onClick={isRecordingVoice ? handleVoiceRecording : () => {}}
          type={isRecordingVoice ? undefined : 'submit'}
        />
      </Box>
    </Stack>
  )
}

const usePlaceholder = (members: ConversationMember[]) => {
  const { account } = useAuthContext()
  const { t } = useTranslation()

  return useMemo(() => {
    const options: TranslateEnumerationOptions<ConversationMember> = {
      elementPartialKey: 'member',
      getElementValue: (member) => member.getDisplayName(),
      translaters: [
        () =>
          // The user is chatting with themself
          t('message_input_placeholder_1', { member0: account?.getDisplayName() }),
        (interpolations) => t('message_input_placeholder_1', interpolations),
        (interpolations) => t('message_input_placeholder_2', interpolations),
        (interpolations) => t('message_input_placeholder_3', interpolations),
        (interpolations) => t('message_input_placeholder_4', interpolations),
        (interpolations) => t('message_input_placeholder_more', interpolations),
      ],
    }

    return translateEnumeration<ConversationMember>(members, options)
  }, [account, members, t])
}
