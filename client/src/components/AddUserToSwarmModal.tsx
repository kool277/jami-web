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

import { Box, Button, Modal, Paper, useMediaQuery, useTheme } from '@mui/material'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider.js'
import { useConversationContext } from '../contexts/ConversationProvider.js'
import { useAddMemberToSwarm } from '../services/conversationQueries.js'
import ContactList from './ContactList.js'

interface AddUserToSwarmModalProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function AddUserToSwarmModal({ open, setOpen }: AddUserToSwarmModalProps) {
  const { conversationId, members } = useConversationContext()
  const addMembers = useAddMemberToSwarm(conversationId)
  const [selectedContacts, setSelectedContact] = useState<string[]>([])
  const theme = useTheme()
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const { t } = useTranslation()
  const { setAlertContent } = useContext(AlertSnackbarContext)

  const handleSelectedContact = (contact: string) => {
    if (selectedContacts.includes(contact)) {
      setSelectedContact(selectedContacts.filter((item) => item !== contact))
    } else {
      setSelectedContact([...selectedContacts, contact])
    }
  }

  const membersUris = members.map((member) => member.contact.uri)

  function addToSwarm() {
    if (selectedContacts.length === 0) {
      setAlertContent({
        messageI18nKey: 'add_to_group_no_user_selected',
        severity: 'error',
        alertOpen: true,
      })
      return
    }

    addMembers.mutate(selectedContacts)
    setSelectedContact([])
    setOpen(false)
  }

  const stylesInCommon = {
    height: 'auto',
    backgroundColor: theme.ChatInterface.panelColor,
    borderRadius: '10px',
    marginTop: '3.6%',
  }

  const nonMobileStyles = {
    ...stylesInCommon,
    width: '400px',
    position: 'absolute',
    right: 0,
    marginRight: '0.5%',
  }

  const mobileStyles = {
    ...stylesInCommon,
    width: '100%',
  }

  return (
    <>
      <Modal
        sx={isMobile ? { padding: '8px' } : {}}
        open={open}
        onClose={() => {
          setOpen(false)
          setSelectedContact([])
        }}
      >
        <Paper elevation={24} sx={isMobile ? mobileStyles : nonMobileStyles}>
          <Box sx={{ textAlign: 'start', paddingTop: isMobile ? '1px' : 'unset', paddingLeft: '10px' }}>
            <h3>{t('add_users_to_group')}</h3>
          </Box>
          <Box sx={{ marginTop: '-2%', minHeight: '300px' }}>
            <ContactList
              setSelectedContact={handleSelectedContact}
              selectedContacts={selectedContacts}
              members={membersUris}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', paddingBottom: '2%' }}>
            <Button sx={{ margin: '2px' }} variant="contained" onClick={addToSwarm}>
              {t('add_to_group_validation')}
            </Button>
          </Box>
        </Paper>
      </Modal>
    </>
  )
}
