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

import { Box } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

import DownloadFileIcon from '../icons/downloadFile.svg?react'
import AudioVisual from './AudioVisual'

interface AudioPlayerProps {
  blob?: Blob
  backgroundColor: string
}

function AudioPlayer({ blob, backgroundColor }: AudioPlayerProps) {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer>()
  const [error, setError] = useState<string>()
  const [audioContext, setAudioContext] = useState<AudioContext>()
  const [isPlaying, setIsPlaying] = useState(false)
  const [source, setSource] = useState<AudioBufferSourceNode | null>(null)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (blob === undefined) {
      return
    }
    const fetchAudio = async () => {
      try {
        const audioData = await blob.arrayBuffer()
        const context = new window.AudioContext()
        setAudioContext(context)
        const decodedData = await context.decodeAudioData(audioData)
        setAudioBuffer(decodedData)
        setError('')
      } catch (error) {
        console.error('Error fetching audio file:', error)
        setError('Failed to load audio. Please try again later.')
        setAudioBuffer(undefined)
      }
    }

    fetchAudio()
  }, [blob, setAudioBuffer, setError, setAudioContext])

  useEffect(() => {
    if (blob === undefined) {
      return
    }
    let intervalId: NodeJS.Timeout
    if (isPlaying) {
      intervalId = setInterval(() => {
        setCurrentTime((prevTime) => {
          if (audioBuffer !== undefined && prevTime >= audioBuffer.duration) {
            clearInterval(intervalId)
            setIsPlaying(false)
            return 0
          }
          return prevTime + 0.1
        })
      }, 100)
    }
    return () => clearInterval(intervalId)
  }, [isPlaying, audioBuffer, setCurrentTime, setIsPlaying, setAudioBuffer, blob])

  const playPauseAudio = useCallback(() => {
    if (audioBuffer && audioContext) {
      if (isPlaying) {
        if (source) {
          source.stop()
        }
        setIsPlaying(false)
      } else {
        const newSource = audioContext.createBufferSource()
        newSource.buffer = audioBuffer
        newSource.connect(audioContext.destination)
        if (currentTime === 0) {
          newSource.start()
          setSource(newSource)
        } else {
          newSource.start(0, currentTime)
          setSource(newSource)
        }
        setIsPlaying(true)
      }
    }
  }, [audioBuffer, audioContext, currentTime, isPlaying, source])

  const audioContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: backgroundColor,
    borderRadius: '25px',
    padding: '10px',
    width: '350px',
    justifyContent: 'space-between',
  }

  const playButtonStyles = {
    marginTop: '-2%',
    paddingLeft: '10px',
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
  }

  const waveformContainerStyles = {
    flexGrow: 1,
    margin: '0 10px',
    cursor: 'pointer',
  }

  const audioDurationStyles = {
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  }

  const handleDownload = () => {
    if (audioBuffer && blob !== undefined) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = 'audio.wav'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  const getFormatedTime = () => {
    const valueToStr = currentTime.toString()
    const numberToDisplay = valueToStr.split('.')[0].length
    const time = currentTime.toPrecision(numberToDisplay)
    if (time[0] === '0') {
      return '1'
    } else return (Number(time) + 1).toString()
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={audioContainerStyles}>
        <Box component="div" sx={playButtonStyles} onClick={audioBuffer ? playPauseAudio : undefined}>
          {isPlaying ? '❚❚' : '▶'}
        </Box>
        <Box sx={waveformContainerStyles} onClick={playPauseAudio}>
          {audioBuffer && <AudioVisual audioBuffer={audioBuffer} currentTime={currentTime} />}
        </Box>
        <span style={audioDurationStyles}>{currentTime !== 0 ? getFormatedTime() : null}</span>
        <Box onClick={handleDownload} sx={{ marginTop: '2%', cursor: 'pointer' }}>
          <DownloadFileIcon />
        </Box>
      </Box>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </Box>
  )
}

export default AudioPlayer
