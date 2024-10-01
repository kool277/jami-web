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

import { Box, Divider, ListItem, ListItemAvatar, ListItemText } from '@mui/material'
import List from '@mui/material/List'
import { motion } from 'framer-motion'
import { memo, SetStateAction, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  useBlockContactMutation,
  useContactListQuery,
  useContactQuery,
  useRemoveContactMutation,
} from '../services/contactQueries'
import ContactDetailDialog from './ContactDetailDialog'
import ContactSearchBar from './ContactSearchBar'
import ContextMenu, { ContextMenuHandler, useContextMenuHandler } from './ContextMenu'
import ConversationAvatar from './ConversationAvatar'
import { ConfirmationDialog, useDialogHandler } from './Dialog'
import LoadingPage from './Loading'
import { PopoverListItemData } from './PopoverList'
import { BlockContactIcon, CancelIcon, CheckedIcon, PersonIcon } from './SvgIcon'

interface ContactListProps {
  members?: string[]
  selectedContacts?: string[]
  setSelectedContact?: (contact: string) => void
}

export default function ContactList({ setSelectedContact, selectedContacts, members }: ContactListProps) {
  const [currentContactId, setCurrentContactId] = useState<string>('')
  const [isBlocking, setIsBlocking] = useState(true)
  const [contactDetailDialogOpen, setContactDetailDialogOpen] = useState<boolean>(false)
  const contactListQuery = useContactListQuery()
  const { isLoading, data: contacts } = contactListQuery
  const [filterValue, setFilterValue] = useState('')
  const { t } = useTranslation()
  const singleContactQuery = useContactQuery(currentContactId)
  const { data: contactDetail } = singleContactQuery
  const contextMenuHandler = useContextMenuHandler()

  const {
    props: { open: dialogOpen, onClose: closeContactDialog },
    openDialog: openContactDialog,
  } = useDialogHandler()

  const ContactDetailDialogElement = useMemo(() => {
    const onClosingContactDetailDialog = () => setContactDetailDialogOpen(false)
    return (
      <ContactDetailDialog
        contactDetail={contactDetail}
        open={contactDetailDialogOpen}
        onClose={onClosingContactDetailDialog}
      />
    )
  }, [contactDetail, contactDetailDialogOpen])

  const filteredContacts = useMemo(() => {
    const inSwarm: string[] = []
    if (members !== undefined) {
      for (const member of members) {
        inSwarm.push(member)
      }
    }
    const preFilter = contacts?.filter((contact) => !inSwarm.includes(contact.id))
    if (filterValue === '') {
      return preFilter
    }
    return preFilter?.filter((contact) => contact.username.toLowerCase().includes(filterValue.toLowerCase()))
  }, [contacts, filterValue, members])

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterValue(event.target.value)
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  }

  if (isLoading) {
    return <LoadingPage />
  }

  return (
    <>
      <ContactDialog
        isBlocking={isBlocking}
        open={dialogOpen}
        closeContactDialog={closeContactDialog}
        currentContactId={currentContactId}
      />
      {ContactDetailDialogElement}

      <ContactMenu
        contextMenuProps={contextMenuHandler.props}
        openContactDialog={openContactDialog}
        setIsBlocking={setIsBlocking}
        setContactDetailDialogOpen={setContactDetailDialogOpen}
      />
      <ContactSearchBar placeholder={t('find_contacts')} handleChange={handleFilterChange} />
      <List>
        {filteredContacts?.map((contact) => (
          <>
            <ListItem
              onClick={() => setSelectedContact && setSelectedContact(contact.id)}
              sx={{ cursor: 'pointer' }}
              alignItems="flex-start"
              key={contact.id}
              onContextMenu={(e) => {
                setCurrentContactId(contact.id)
                contextMenuHandler.handleAnchorPosition(e)
              }}
            >
              <ListItemAvatar>
                <ConversationAvatar contactUri={contact.id} displayName={contact.username} />
              </ListItemAvatar>
              <ListItemText primary={contact.username} secondary={contact.id} />
              {selectedContacts !== undefined && selectedContacts.includes(contact.id) && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    textAlign: 'center',
                    alignContent: 'center',
                    alignItems: 'center',
                    marginTop: '5%',
                  }}
                >
                  <motion.div variants={item} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
                    <CheckedIcon />
                  </motion.div>
                </Box>
              )}
            </ListItem>
            {contact.id !== filteredContacts[filteredContacts.length - 1].id && <Divider variant="middle" />}
          </>
        ))}
      </List>
      {filteredContacts !== undefined && filteredContacts.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', textAlign: 'center' }}>No contacts found</Box>
      )}
    </>
  )
}

interface ContactMenuProps {
  contextMenuProps: ContextMenuHandler['props']
  openContactDialog: () => void
  setIsBlocking: React.Dispatch<SetStateAction<boolean>>
  setContactDetailDialogOpen: React.Dispatch<SetStateAction<boolean>>
}

const ContactMenu = ({
  contextMenuProps,
  openContactDialog,
  setIsBlocking,
  setContactDetailDialogOpen,
}: ContactMenuProps) => {
  const { t } = useTranslation()
  const menuOptions: PopoverListItemData[] = useMemo(
    () => [
      {
        label: t('contact_details_text'),
        Icon: PersonIcon,
        onClick: () => {
          setContactDetailDialogOpen(true)
        },
      },
      {
        label: t('contact_block'),
        Icon: BlockContactIcon,
        onClick: () => {
          openContactDialog()
          setIsBlocking(true)
        },
      },
      {
        label: t('contact_remove'),
        Icon: CancelIcon,
        onClick: () => {
          openContactDialog()
          setIsBlocking(false)
        },
      },
    ],
    [t, setIsBlocking, setContactDetailDialogOpen, openContactDialog],
  )
  return <ContextMenu {...contextMenuProps} items={menuOptions} />
}

interface ContactDialogProps {
  isBlocking: boolean
  open: boolean
  closeContactDialog: () => void
  currentContactId: string
}

const ContactDialog = memo(({ isBlocking, open, closeContactDialog, currentContactId }: ContactDialogProps) => {
  const removeContactMutation = useRemoveContactMutation()
  const blockContactMutation = useBlockContactMutation()

  const removeContact = (): void => {
    removeContactMutation.mutate(currentContactId)
    closeContactDialog()
  }

  const blockContact = (): void => {
    blockContactMutation.mutate(currentContactId)
    closeContactDialog()
  }

  const { t } = useTranslation()
  return (
    <ConfirmationDialog
      open={open}
      onClose={closeContactDialog}
      title={t('dialog_confirm_title_default')}
      content={isBlocking ? t('contact_ask_confirm_block') : t('contact_ask_confirm_remove')}
      onConfirm={isBlocking ? blockContact : removeContact}
      confirmButtonText={isBlocking ? t('contact_confirm_block') : t('contact_confirm_remove')}
    />
  )
})
