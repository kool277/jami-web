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
import { SearchRounded } from '@mui/icons-material';
import { InputBase, List, Stack } from '@mui/material';
import { ChangeEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConversationsSummariesQuery } from '../services/conversationQueries';
import { SquareButton } from './Button';
import ContactSearchResultList from './ContactSearchResultList';
import ConversationListItem from './ConversationListItem';
import { PeopleGroupIcon } from './SvgIcon';
import { Tab, TabPanel, Tabs, TabsList } from './Tabs';

export default function ConversationList() {
  const { t } = useTranslation();
  const [searchFilter, setSearchFilter] = useState('');

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(event.target.value);
  }, []);

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
      {searchFilter ? <ContactSearchResultList searchFilter={searchFilter} /> : <ConversationTabs />}
    </Stack>
  );
}

const ConversationTabs = () => {
  const { t } = useTranslation();
  const invitations = [];

  return (
    <Tabs defaultValue={0}>
      {invitations.length !== 0 && (
        <TabsList>
          <Tab>{t('conversations')}</Tab>
          <Tab>{t('invitations')}</Tab>
        </TabsList>
      )}
      <ConversationsTabPanel />
      <InvitationsTabPanel />
    </Tabs>
  );
};

const ConversationsTabPanel = () => {
  const conversationsSummariesQuery = useConversationsSummariesQuery();
  const conversationsSummaries = conversationsSummariesQuery.data;

  return (
    <TabPanel value={0}>
      <List>
        {conversationsSummaries?.map((conversationSummary) => (
          <ConversationListItem key={conversationSummary.id} conversationSummary={conversationSummary} />
        ))}
      </List>
    </TabPanel>
  );
};

const InvitationsTabPanel = () => {
  const { t } = useTranslation();

  return <TabPanel value={1}>{t('invitations')}</TabPanel>;
};
