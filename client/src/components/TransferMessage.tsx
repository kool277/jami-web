/*
 * Copyright (C) 2025 Savoir-faire Linux Inc.
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

import { Box, Card, CardHeader, Modal, TextField, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Message } from 'jami-web-common'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useTransferMessageMutation } from '../services/conversationQueries'
import { useTransferFileMutation } from '../services/dataTransferQueries'
import { SendMessageButton } from './Button'
import { SelectConversationList } from './SelectConversationList'

interface TransferMessageProps {
  conversationId: string
  message: Message
  onClose: () => void
  open: boolean
}

const TransferMessage = ({ conversationId, message, onClose, open }: TransferMessageProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))

  const [comment, setComment] = useState<string>('')
  const [selectedConversations, setselectedConversations] = useState<string[]>([])

  const messageBody = message.body
  const isFile = message?.type === 'application/data-transfer+json'

  const transferMessageMutation = useTransferMessageMutation(conversationId)
  const transferFileMutation = useTransferFileMutation(conversationId)

  const selectConversation = (contact: string) => {
    if (selectedConversations.includes(contact)) {
      setselectedConversations(selectedConversations.filter((c) => c !== contact))
      return
    }
    setselectedConversations([...selectedConversations, contact])
  }

  const handleTransfer = () => {
    if (!selectedConversations || selectedConversations.length === 0) {
      return
    }

    if (!isFile) {
      transferMessageMutation.mutate({ messageBody, targetedConversations: selectedConversations, comment })
      onClose()
      return
    }

    const fileName = message?.displayName
    const fileId = message?.fileId

    if (!fileId || !fileName) {
      console.error('FileId or fileName is missing')
      return
    }

    transferFileMutation.mutate({
      conversationId,
      fileId,
      fileName,
      targetedConversations: selectedConversations,
      comment,
    })
    onClose()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const cardElement = document.querySelector('.transfer-message-card')
      if (cardElement && !cardElement.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  return (
    <Modal open={open} onClose={onClose}>
      <Card
        className="transfer-message-card"
        sx={{
          position: 'fixed',
          zIndex: 999999,
          top: '50%',
          left: isMobile ? '50%' : '70%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          padding: '1px',
          backgroundColor: theme.ChatInterface.panelColor,
          color: theme.ChatInterface.fontColor,
          maxWidth: isMobile ? '300px' : 'unset',
          minWidth: isMobile ? 'unset' : '350px',
        }}
      >
        <CardHeader
          title={
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                alignContent: 'center',
              }}
            >
              <Typography sx={{ color: theme.TranferMessage.titleColor, userSelect: 'none' }} variant="h6">
                {t('transfer_message')}
              </Typography>
              <SendMessageButton
                disabled={selectedConversations.length === 0}
                onClick={handleTransfer}
                type={'submit'}
              />
            </Box>
          }
        />

        <Box
          sx={{
            maxHeight: '300px',
            overflowY: 'auto',
            padding: 1,
          }}
        >
          <SelectConversationList
            selectedConversationIds={selectedConversations}
            onSelectConversation={selectConversation}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
            <TextField
              maxRows={1}
              placeholder={t('add_comment')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              variant="outlined"
              sx={{
                borderRadius: '12px',
                textAlign: 'start',
                border: 'none',
                maxHeight: '50px',
                width: '80%',
                backgroundColor: theme.TranferMessage.inputColor,
                color: theme.TranferMessage.fontColor,
                '& fieldset': {
                  border: 'none',
                  maxHeight: '50px',
                },
              }}
            />
          </Box>
        </Box>
      </Card>
    </Modal>
  )
}

export default TransferMessage
