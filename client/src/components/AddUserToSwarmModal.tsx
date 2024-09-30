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

import { Box, Button, Modal } from '@mui/material'
import { useState } from 'react'

import { useConversationContext } from '../contexts/ConversationProvider'
import { useAddMemberToSwarm } from '../services/conversationQueries'
import { AddParticipantButton } from './Button'
import ContactList from './ContactList'

export default function AddUserToSwarmModal() {
  const [open, setOpen] = useState<boolean>(false)
  const { conversationId, members } = useConversationContext()
  const addMembers = useAddMemberToSwarm(conversationId)
  const [selectedContacts, setSelectedContact] = useState<string[]>([])

  const handleSelectedContact = (contact: string) => {
    if (selectedContacts.includes(contact)) {
      setSelectedContact(selectedContacts.filter((item) => item !== contact))
    } else {
      setSelectedContact([...selectedContacts, contact])
    }
  }

  const membersUris = members.map((member) => member.contact.uri)

  function addToSwarm() {
    addMembers.mutate(selectedContacts)
    setSelectedContact([])
    setOpen(false)
  }

  return (
    <>
      <AddParticipantButton
        onClick={() => {
          setOpen(true)
        }}
      />
      <Modal
        open={open}
        onClose={() => {
          setOpen(false)
          setSelectedContact([])
        }}
      >
        <Box
          sx={{
            width: 'auto',
            height: 'auto',
            backgroundColor: 'white',
            position: 'absolute',
            borderRadius: '10px',
            right: 0,
            marginRight: '0.5%',
            marginTop: '3.6%',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <h3>Add User to Swarm</h3>
          </Box>
          <Box sx={{ marginTop: '-2%' }}>
            <ContactList
              setSelectedContact={handleSelectedContact}
              selectedContacts={selectedContacts}
              members={membersUris}
            />
          </Box>
          {selectedContacts.length === 0 ? (
            <Box sx={{ paddingBottom: '6%' }}></Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', paddingBottom: '2%' }}>
              <Button sx={{ margin: '2px' }} variant="contained" onClick={addToSwarm}>
                Add to Swarm
              </Button>
            </Box>
          )}
        </Box>
      </Modal>
    </>
  )
}
