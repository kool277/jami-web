/*
 * Copyright (C) 2022 Savoir-faire Linux Inc.
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
import GroupAddRounded from '@mui/icons-material/GroupAddRounded';
import { Box, Dialog, DialogProps, Fab, List, ListSubheader, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Contact } from '../models/contact';
import { useAddContactMutation, useContactsSearchQuery } from '../services/contactQueries';
import { useConversationsSummariesQuery } from '../services/conversationQueries';
import ConversationAvatar from './ConversationAvatar';
import { ConversationSummaryList } from './ConversationSummaryList';
import { CustomListItemButton } from './CustomListItemButton';
import { useDialogHandler } from './Dialog';
import LoadingPage from './Loading';

type ContactSearchResultListProps = {
  searchFilter: string;
};

export default ({ searchFilter }: ContactSearchResultListProps) => {
  const { t } = useTranslation();

  const contactsSearchQuery = useContactsSearchQuery(searchFilter);
  // TODO: Filter conversations
  const conversationsSummariesQuery = useConversationsSummariesQuery();

  const isLoading = contactsSearchQuery.isLoading && conversationsSummariesQuery.isLoading;

  if (isLoading) {
    return <LoadingPage />;
  }

  const conversationsSummaries = conversationsSummariesQuery.data;
  const contactsSearchResult = contactsSearchQuery.data;

  return (
    <List>
      {contactsSearchResult && contactsSearchResult.length > 0 && (
        <>
          <ListSubheader>{t('search_results')}</ListSubheader>
          {contactsSearchResult?.map((contact) => (
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
  );
};

type ContactSearchResultListItemProps = {
  contact: Contact;
};

const ContactSearchResultListItem = ({ contact }: ContactSearchResultListItemProps) => {
  const dialogHandler = useDialogHandler();

  return (
    <>
      <AddContactDialog {...dialogHandler.props} contactId={contact.uri} />
      <CustomListItemButton
        key={contact.uri}
        onClick={() => {
          dialogHandler.openDialog();
        }}
        icon={<ConversationAvatar displayName={contact.getDisplayName()} />}
        primaryText={<Typography variant="body1">{contact.getDisplayName()}</Typography>}
      />
    </>
  );
};

type AddContactDialogProps = DialogProps & {
  contactId: string;
};

const AddContactDialog = ({ contactId, ...props }: AddContactDialogProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addContactMutation = useAddContactMutation();

  const handleClick = async () => {
    addContactMutation.mutate(contactId, {
      onSuccess: (data) => navigate(`/conversation/${data.conversationId}`),
      onSettled: () => props.onClose?.({}, 'escapeKeyDown'), // dummy arguments for 'onClose'
    });
  };

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
  );
};
