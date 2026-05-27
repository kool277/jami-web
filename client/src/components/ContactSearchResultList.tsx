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
import { Box, Dialog, DialogProps, Fab, List, ListSubheader, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { Contact } from '../models/contact.js'
import {
  useAddContactMutation,
  useContactsSearchQuery,
  useJamsContactsSearchQuery,
} from '../services/contactQueries.js'
import { useConversationsSummariesQuery } from '../services/conversationQueries.js'
import ConversationAvatar from './ConversationAvatar.js'
import { ConversationSummaryList } from './ConversationSummaryList.js'
import { CustomListItemButton } from './CustomListItemButton.js'
import { useDialogHandler } from './Dialog.js'
import LoadingPage from './Loading.js'
import { GroupAddRoundedIcon as GroupAddRounded } from './SvgIcon.js'

type ContactSearchResultListProps = {
  searchFilter: string
}

export default ({ searchFilter }: ContactSearchResultListProps) => {
  const { t } = useTranslation()

  const contactsSearchQuery = useContactsSearchQuery(searchFilter)
  const contactsJamsSearchQuery = useJamsContactsSearchQuery(searchFilter)

  // TODO: Filter conversations
  const conversationsSummariesQuery = useConversationsSummariesQuery()

  const isLoading = contactsSearchQuery.isLoading && conversationsSummariesQuery.isLoading

  if (isLoading) {
    return <LoadingPage />
  }

  const conversationsSummaries = conversationsSummariesQuery.data
  const contactsSearchResult = contactsSearchQuery.data
  const contactsJamsSearchResult = contactsJamsSearchQuery.data

  return (
    <List>
      <ListSubheader>{t('search_results')}</ListSubheader>

      {contactsSearchResult && contactsSearchResult.length > 0 && (
        <>
          {contactsSearchResult?.map((contact) => (
            <ContactSearchResultListItem key={contact.uri} contact={contact} />
          ))}
        </>
      )}
      {contactsJamsSearchResult && contactsJamsSearchResult.length > 0 && (
        <>
          {contactsJamsSearchResult?.map((contact) => (
            <ContactSearchResultListItem key={contact.uri} contact={contact} />
          ))}
        </>
      )}
      {conversationsSummaries && conversationsSummaries.length > 0 && (
        <>
          <ListSubheader>{t('conversations')}</ListSubheader>
          <ConversationSummaryList conversationsSummaries={conversationsSummaries} />
        </>
      )}
    </List>
  )
}

type ContactSearchResultListItemProps = {
  contact: Contact
}

const ContactSearchResultListItem = ({ contact }: ContactSearchResultListItemProps) => {
  const dialogHandler = useDialogHandler()

  return (
    <>
      <AddContactDialog {...dialogHandler.props} contactId={contact.uri} />
      <CustomListItemButton
        key={contact.uri}
        onClick={() => {
          dialogHandler.openDialog()
        }}
        icon={<ConversationAvatar contactUri={contact.uri} displayName={contact.getDisplayName()} />}
        primaryText={<Typography variant="body1">{contact.getDisplayName()}</Typography>}
      />
    </>
  )
}

type AddContactDialogProps = DialogProps & {
  contactId: string
}

const AddContactDialog = ({ contactId, ...props }: AddContactDialogProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const addContactMutation = useAddContactMutation()

  const handleClick = async () => {
    addContactMutation.mutate(contactId, {
      onSuccess: (data) => navigate(`/conversation/${data.conversationId}`),
      onSettled: () => props.onClose?.({}, 'escapeKeyDown'), // dummy arguments for 'onClose'
    })
  }

  return (
    <Dialog {...props}>
      <Typography variant="h6">{t('jami_user_id')}</Typography>
      <Typography variant="body1">{contactId}</Typography>
      <Box style={{ textAlign: 'center', marginTop: 16 }}>
        <Fab variant="extended" color="primary" onClick={handleClick}>
          <GroupAddRounded />
          {t('conversation_add_contact')}
        </Fab>
      </Box>
    </Dialog>
  )
}
