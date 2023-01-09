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
import { useEffect, useState } from 'react';
// import Modal from '@mui/material/Modal';
import Modal from 'react-modal';

import { useAuthContext } from '../contexts/AuthProvider';
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

  const [contacts, setContacts] = useState<Array<any>>([]);
  const [currentContactId, setCurrentContactId] = useState<string>('');
  const [parentModalOpen, setParentModalOpen] = useState<boolean>(false);
  const [childModalOpen, setChildModalOpen] = useState<boolean>(false);
  const [isBlocking, setIsBlocking] = useState(true);
  // const [modalDetailsIsOpen, setModalDetailsIsOpen] = useState(false);

  const closeParentModal = () => setParentModalOpen(false);
  const openChildModal = () => setChildModalOpen(true);
  const closeChildModal = () => setChildModalOpen(false);

  const handleClickContact = (id: string) => {
    setCurrentContactId(id);
    setParentModalOpen(true);
  };
  // const openModalDetails = () => setModalDetailsIsOpen(true);

  //   const getContactDetails = () => {
  //     const controller = new AbortController();
  //     // try {
  //     //     const { data } = await axiosInstance.get(`/contacts/${currentContactId}`, {
  //     //         signal: controller.signal,
  //     //     });
  //     //     console.log('CONTACT LIST - DETAILS: ', data);
  //     // } catch (e) {
  //     //     console.log('ERROR GET CONTACT DETAILS: ', e);
  //     // }

  //     axiosInstance
  //       .get(`/contacts/${currentContactId}`, {
  //         signal: controller.signal,
  //       })
  //       .then((data) => {
  //         console.log('CONTACT LIST - DETAILS: ', data);
  //       })
  //       .catch((err) => {
  //         console.log('ERROR GET CONTACT DETAILS: ', err);
  //       });
  //   };

  const removeOrBlock = () => {
    console.log('remove or block');
    const controller = new AbortController();

    //Not sure if the server handles empty contact id
    if (currentContactId === '') {
      throw 'currentContactId is empty';
    }

    let url = `/contacts/${currentContactId}`;
    if (isBlocking) {
      url += '/block';
    }

    // try {
    //   await axiosInstance(url, {
    //     signal: controller.signal,
    //     method: block ? 'POST' : 'DELETE',
    //   });
    // } catch (e) {
    //   console.log(`ERROR ${block ? 'blocking' : 'removing'} CONTACT : `, e);
    // }

    axiosInstance(url, {
      signal: controller.signal,
      method: isBlocking ? 'POST' : 'DELETE',
    }).catch((err) => {
      console.log(`ERROR ${isBlocking ? 'blocking' : 'removing'} CONTACT : `, err);
    });

    closeChildModal();
  };

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
              closeParentModal();
              openChildModal();
            }}
          >
            <Person /> Supprimer contact
          </button>

          <button
            onClick={() => {
              console.log('open dialog BLOCK: ');
              setIsBlocking(true);
              closeParentModal();
              openChildModal();
            }}
          >
            <Person /> Bloquer le contact
          </button>

          <button
            onClick={() => {
              console.log('open details contact for: ');
              closeParentModal();
              // openModalDetails();
              // getContactDetails();
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
          <div>Voulez vous vraiment {isBlocking ? 'bloquer' : 'supprimer'} ce contact?</div>
          <br />

          <button onClick={() => removeOrBlock()}>{isBlocking ? 'bloquer' : 'supprimer'}</button>

          <button onClick={closeChildModal}>Annuler</button>
        </Box>
      </Modal>

      <List>
        {contacts?.map((contact) => (
          <ListItem
            button
            alignItems="flex-start"
            key={contact.id}
            // selected={isSelected}
            onClick={() => handleClickContact(contact.id)}
          >
            <ListItemAvatar>
              <ConversationAvatar
              // displayName={conversation.getDisplayNameNoFallback()}
              // displayName={`${contact.id}`}
              />
            </ListItemAvatar>
            <ListItemText primary={contact.id} secondary={contact.id} />
          </ListItem>
        ))}
      </List>
    </>
  );
}
