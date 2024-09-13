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

import { ListItem, ListItemAvatar, ListItemText } from '@mui/material'
import List from '@mui/material/List'
import { memo, SetStateAction, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  useBlockContactMutation,
  useContactListQuery,
  useContactQuery,
  useRemoveContactMutation,
} from '../services/contactQueries'
import { useMembersQuery } from '../services/conversationQueries'
import ContactDetailDialog from './ContactDetailDialog'
import ContextMenu, { ContextMenuHandler, useContextMenuHandler } from './ContextMenu'
import ConversationAvatar from './ConversationAvatar'
import { ConfirmationDialog, useDialogHandler } from './Dialog'
import LoadingPage from './Loading'
import { PopoverListItemData } from './PopoverList'
import { BlockContactIcon, CancelIcon, PersonIcon } from './SvgIcon'

export default function ContactList() {
  const [currentContactId, setCurrentContactId] = useState<string>('')
  const [isBlocking, setIsBlocking] = useState(true)
  const [contactDetailDialogOpen, setContactDetailDialogOpen] = useState<boolean>(false)

  const contactListQuery = useContactListQuery()
  const { isLoading, data: contacts } = contactListQuery

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

      <List>
        {contacts?.map((contact) => (
          <ListItem
            alignItems="flex-start"
            key={contact.id}
            onContextMenu={(e) => {
              setCurrentContactId(contact.id)
              contextMenuHandler.handleAnchorPosition(e)
            }}
          >
            <ListItemAvatar>
              <ConversationAvatar />
            </ListItemAvatar>
            <ContactInfo conversationId={contact.conversationId} contactId={contact.id} />
          </ListItem>
        ))}
      </List>
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

const ContactInfo = ({ conversationId, contactId }: { conversationId: string; contactId: string }) => {
  const membersQuery = useMembersQuery(conversationId)
  const { t } = useTranslation()

  const data = membersQuery.data
  let name = data?.filter((member) => member.contact.uri === contactId)[0].getDisplayName()

  if (name === '' || name === undefined) {
    name = t('unknown_user')
  }

  return <ListItemText primary={name} secondary={contactId} />
}
