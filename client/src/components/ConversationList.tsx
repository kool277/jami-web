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
import { GroupRounded as GroupIcon, SearchRounded } from '@mui/icons-material';
import { InputBase } from '@mui/material';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import { Stack } from '@mui/system';
import { ChangeEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useContactsSearchQuery } from '../services/contactQueries';
import { useConversationsSummariesQuery } from '../services/conversationQueries';
import { SquareButton } from './Button';
import ContactSearchResultList from './ContactSearchResultList';
import ConversationListItem from './ConversationListItem';
import LoadingPage from './Loading';
import { PeopleGroupIcon } from './SvgIcon';

export default function ConversationList() {
  const { t } = useTranslation();

  const [searchFilter, setSearchFilter] = useState('');

  const conversationsSummariesQuery = useConversationsSummariesQuery();
  const contactsSearchQuery = useContactsSearchQuery(searchFilter);

  const conversationsSummaries = conversationsSummariesQuery.data;
  const contactsSearchResult = contactsSearchQuery.data;

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(event.target.value);
  }, []);

  if (!conversationsSummaries) {
    return <LoadingPage />;
  }

  return (
    <Stack>
      <Stack direction="row">
        <InputBase
          type="search"
          placeholder={t('find_users_and_conversations')}
          onChange={handleInputChange}
          startAdornment={<SearchRounded />}
          sx={{
            flexGrow: 1,
          }}
        />
        <SquareButton aria-label="start swarm" Icon={PeopleGroupIcon} />
      </Stack>
      <List>
        {contactsSearchResult && contactsSearchResult.length > 0 && (
          <>
            <ListSubheader>{t('search_results')}</ListSubheader>
            <ContactSearchResultList contacts={contactsSearchResult} />
            <ListSubheader>{t('conversations')}</ListSubheader>
          </>
        )}
        {conversationsSummaries.map((conversationSummary) => (
          <ConversationListItem key={conversationSummary.id} conversationSummary={conversationSummary} />
        ))}
        {conversationsSummaries.length === 0 && (
          <Stack>
            <GroupIcon color="disabled" fontSize="large" />
            <Typography variant="subtitle2">{t('no_conversations')}</Typography>
          </Stack>
        )}
      </List>
    </Stack>
  );
}
