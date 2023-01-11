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

import { Person } from '@mui/icons-material';
import { Box, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import List from '@mui/material/List';
import { ContactDetails as ContactDetailType } from 'jami-web-common';
import { useEffect, useMemo, useState } from 'react';
import Modal from 'react-modal';

import { useAuthContext } from '../contexts/AuthProvider';
import ContactDetailDialog from './ContactDetailDialog';
import ConversationAvatar from './ConversationAvatar';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};

export default function ContactList() {
  const { axiosInstance } = useAuthContext();

  // const { accountId } = useAppSelector((state) => state.userInfo);
  // const dispatch = useAppDispatch();

  const [contacts, setContacts] = useState<Array<ContactDetailType>>([]);
  const [currentContactId, setCurrentContactId] = useState<string>('');
  const [parentModalOpen, setParentModalOpen] = useState<boolean>(false);
  const [childModalOpen, setChildModalOpen] = useState<boolean>(false);
  const [isBlocking, setIsBlocking] = useState(true);
  const [contactDetail, setContactDetail] = useState<ContactDetailType>({
    added: '',
    confirmed: '',
    conversationId: '',
    id: '',
  });
  const closeParentModal = () => setParentModalOpen(false);
  const openChildModal = () => setChildModalOpen(true);
  const closeChildModal = () => setChildModalOpen(false);

  const [contactDetailDialogOpen, setContactDetailDialogOpen] = useState<boolean>(false);

  const handleClickContact = (id: string): void => {
    setCurrentContactId(id);
    setParentModalOpen(true);
  };

  const getContactDetails = () => {
    axiosInstance
      .get<ContactDetailType>(`/contacts/${currentContactId}`)
      .then(({ data }) => {
        setContactDetail(data);
      })
      .catch((err) => {
        console.log('ERROR GET CONTACT DETAILS: ', err);
      });
  };

  const removeContact = (): void => {
    console.log('Removing contact');

    //Not sure if the server handles empty contact id
    if (currentContactId === '') {
      throw 'currentContactId is empty';
    }

    //TODO: put all urls in a single file that can be imported and referenced later
    const url = `/contacts/${currentContactId}`;

    axiosInstance(url, {
      method: 'DELETE',
    })
      .then((res) => {
        if (res.status === 204) {
          //removes the contact from UI, but does not make another request to fetch all contacts
          setContacts((prev) => {
            return prev.filter((contact) => contact.id !== currentContactId);
          });
          //TODO: show notification of success
        }
      })
      .catch((err) => {
        console.log(`ERROR removing CONTACT : ${currentContactId} `, err);
      });

    closeChildModal();
    closeParentModal();
  };

  const blockContact = (): void => {
    console.log('remove or block');

    //Not sure if the server handles empty contact id
    if (currentContactId === '') {
      throw 'currentContactId is empty';
    }

    const url = `/contacts/${currentContactId}/block`;

    axiosInstance(url, {
      method: 'POST',
    })
      .then((res) => {
        if (res.status === 204) {
          //TODO: Integrate behaviours after blocking a contact
        }
      })
      .catch((err) => {
        console.log(`ERROR blocking CONTACT : ${currentContactId} `, err);
      });

    closeChildModal();
    closeParentModal();
  };

  const ContactDetailDialogElement = useMemo(() => {
    const onClosingContactDetailDialog = () => setContactDetailDialogOpen(false);

    return (
      <ContactDetailDialog
        contactDetail={contactDetail}
        open={contactDetailDialogOpen}
        onClose={onClosingContactDetailDialog}
      />
    );
  }, [contactDetail, contactDetailDialogOpen]);

  useEffect(() => {
    const controller = new AbortController();
    axiosInstance
      .get(`/contacts`, {
        signal: controller.signal,
      })
      .then(({ data }) => {
        console.log('CONTACTS: ', data);
        setContacts(data);
      });
    return () => controller.abort();
  }, [axiosInstance]);

  return (
    <>
      <Modal
        isOpen={parentModalOpen}
        onRequestClose={closeParentModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <button onClick={closeParentModal}>close</button>

        <div style={{ display: 'flex', flexDirection: 'column', rowGap: '10px' }}>
          <button
            onClick={() => {
              console.log('open dialog Supprimer: ');
              setIsBlocking(false);
              openChildModal();
            }}
          >
            <Person /> Supprimer contact
          </button>

          <button
            onClick={() => {
              console.log('open dialog BLOCK: ');
              setIsBlocking(true);
              openChildModal();
            }}
          >
            <Person /> Bloquer le contact
          </button>

          <button
            onClick={() => {
              console.log('open details contact for: ');
              closeParentModal();
              setContactDetailDialogOpen(true);
              getContactDetails();
            }}
          >
            <Person /> Détails du contact
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={childModalOpen}
        onRequestClose={closeChildModal}
        style={customStyles}
        contentLabel="Merci de confirmer"
      >
        <Box>
          <div>
            Voulez vous vraiment {isBlocking ? 'bloquer' : 'supprimer'} ce contact {currentContactId}?
          </div>
          <br />

          <button onClick={isBlocking ? blockContact : removeContact}>{isBlocking ? 'bloquer' : 'supprimer'}</button>

          <button onClick={closeChildModal}>Annuler</button>
        </Box>
      </Modal>

      {ContactDetailDialogElement}

      <List>
        {contacts?.map((contact) => (
          <ListItem alignItems="flex-start" key={contact.id} onClick={() => handleClickContact(contact.id)}>
            <ListItemAvatar>
              <ConversationAvatar />
            </ListItemAvatar>
            <ListItemText primary={contact.id} secondary={contact.id} />
          </ListItem>
        ))}
      </List>
    </>
  );
}
