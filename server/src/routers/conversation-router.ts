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
import { Request, Router } from 'express';
import asyncHandler from 'express-async-handler';
import { ParamsDictionary } from 'express-serve-static-core';
import {
  ContactDetails,
  HttpStatusCode,
  IConversationMember,
  IConversationSummary,
  Message,
  NewConversationRequestBody,
  NewMessageRequestBody,
} from 'jami-web-common';
import { Container } from 'typedi';

import { Jamid } from '../jamid/jamid.js';
import { authenticateToken } from '../middleware/auth.js';

const jamid = Container.get(Jamid);

async function createConversationSummary(
  accountId: string,
  accountUri: string,
  conversationId: string
): Promise<IConversationSummary | undefined> {
  const infos = jamid.getConversationInfos(accountId, conversationId);
  if (Object.keys(infos).length === 0) {
    return undefined;
  }

  const members = jamid.getConversationMembers(accountId, conversationId);

  const membersNames = [];
  for (const member of members) {
    // Exclude current user from returned conversation members
    if (member.uri === accountUri) {
      continue;
    }

    // Add usernames for conversation members
    const { username } = await jamid.lookupAddress(member.uri, accountId);
    membersNames.push(username || member.uri);
  }

  let lastMessage: Message | undefined;
  // Skip "merge" type since they are of no interest for the user
  // Should we add some protection to prevent infinite loop?
  while (!lastMessage || lastMessage.type === 'merge') {
    lastMessage = (
      await jamid.getConversationMessages(accountId, conversationId, lastMessage?.linearizedParent || '', 1)
    )[0];
  }

  return {
    id: conversationId,
    avatar: infos.avatar,
    title: infos.title,
    membersNames,
    lastMessage,
  };
}

export const conversationRouter = Router();

conversationRouter.use(authenticateToken);

conversationRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const accountId = res.locals.accountId;

    // Retrieve the URI of the current account (Account.username actually stores the URI rather than the username)
    const accountUri = jamid.getAccountDetails(accountId)['Account.username'];

    const conversationIds = jamid.getConversationIds(accountId);

    const conversationsSummaries = [];
    for (const conversationId of conversationIds) {
      const conversationSummary = await createConversationSummary(accountId, accountUri, conversationId);
      conversationsSummaries.push(conversationSummary);
    }

    res.send(conversationsSummaries);
  })
);

conversationRouter.post(
  '/',
  (req: Request<ParamsDictionary, ContactDetails | string, Partial<NewConversationRequestBody>>, res) => {
    const { members } = req.body;
    if (members === undefined || members.length !== 1) {
      res.status(HttpStatusCode.BadRequest).send('Missing members or more than one member in body');
      return;
    }

    const accountId = res.locals.accountId;

    const contactId = members[0];
    jamid.addContact(accountId, contactId);
    // We need to manually send a conversation request
    jamid.sendTrustRequest(accountId, contactId);

    const contactDetails = jamid.getContactDetails(accountId, contactId);
    if (Object.keys(contactDetails).length === 0) {
      res.status(HttpStatusCode.NotFound).send('No such member found');
      return;
    }

    res.send(contactDetails);
  }
);

conversationRouter.get(
  '/:conversationId',
  asyncHandler(async (req, res) => {
    const accountId = res.locals.accountId;
    const conversationId = req.params.conversationId;

    // Retrieve the URI of the current account (Account.username actually stores the URI rather than the username)
    const accountUri = jamid.getAccountDetails(accountId)['Account.username'];

    const conversationSummary = await createConversationSummary(accountId, accountUri, conversationId);
    if (conversationSummary === undefined) {
      res.status(HttpStatusCode.NotFound).send('No such conversation found');
      return;
    }

    res.send(conversationSummary);
  })
);

conversationRouter.get(
  '/:conversationId/infos',
  asyncHandler(async (req, res) => {
    const accountId = res.locals.accountId;
    const conversationId = req.params.conversationId;

    const infos = jamid.getConversationInfos(accountId, conversationId);
    if (Object.keys(infos).length === 0) {
      res.status(HttpStatusCode.NotFound).send('No such conversation found');
    }

    res.send(infos);
  })
);

conversationRouter.get(
  '/:conversationId/members',
  asyncHandler(async (req, res) => {
    const accountId = res.locals.accountId;
    const conversationId = req.params.conversationId;

    // Retrieve the URI of the current account (Account.username actually stores the URI rather than the username)
    const accountUri = jamid.getAccountDetails(accountId)['Account.username'];

    const infos = jamid.getConversationInfos(accountId, conversationId);
    if (Object.keys(infos).length === 0) {
      res.status(HttpStatusCode.NotFound).send('No such conversation found');
      return;
    }

    const members = jamid.getConversationMembers(accountId, conversationId);

    const namedMembers: IConversationMember[] = [];
    for (const member of members) {
      // Exclude current user from returned conversation members
      if (member.uri === accountUri) {
        continue;
      }

      // Add usernames for conversation members
      const { username } = await jamid.lookupAddress(member.uri, accountId);
      namedMembers.push({
        role: member.role,
        contact: {
          uri: member.uri,
          registeredName: username,
        },
      });
    }

    res.send(namedMembers);
  })
);

conversationRouter.get(
  '/:conversationId/messages',
  asyncHandler(async (req, res) => {
    const accountId = res.locals.accountId;
    const conversationId = req.params.conversationId;

    const infos = jamid.getConversationInfos(accountId, conversationId);
    if (Object.keys(infos).length === 0) {
      res.status(HttpStatusCode.NotFound).send('No such conversation found');
      return;
    }

    const messages = await jamid.getConversationMessages(accountId, conversationId);
    res.send(messages);
  })
);

conversationRouter.post(
  '/:conversationId/messages',
  (req: Request<ParamsDictionary, string, Partial<NewMessageRequestBody>>, res) => {
    const { message } = req.body;
    if (message === undefined) {
      res.status(HttpStatusCode.BadRequest).send('Missing message in body');
      return;
    }

    const accountId = res.locals.accountId;
    const conversationId = req.params.conversationId;

    const infos = jamid.getConversationInfos(accountId, conversationId);
    if (Object.keys(infos).length === 0) {
      res.status(HttpStatusCode.NotFound).send('No such conversation found');
      return;
    }

    jamid.sendConversationMessage(accountId, conversationId, message);
    res.sendStatus(HttpStatusCode.NoContent);
  }
);

conversationRouter.delete('/:conversationId', (req, res) => {
  jamid.removeConversation(res.locals.accountId, req.params.conversationId);
  res.sendStatus(HttpStatusCode.NoContent);
});
