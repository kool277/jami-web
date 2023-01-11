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
import { ContactDetails as ContactDetailType } from 'jami-web-common';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

import ConversationAvatar from './ConversationAvatar';
import { InfosDialog } from './Dialog';
import { DialogContentList } from './Dialog';

interface ContactDetailDialogProps {
  contactDetail: ContactDetailType;
  open: boolean;
  onClose: () => void;
}

const ContactDetailDialog = ({ contactDetail, open, onClose }: ContactDetailDialogProps) => {
  const { t } = useTranslation();
  const items = [
    {
      label: t('contact_details_name'),
      value: contactDetail.id,
    },
    {
      label: t('contact_details_identifier'),
      value: contactDetail.id,
    },
    {
      label: t('contact_details_qr_code'),
      value: <QRCodeCanvas size={80} value={`${contactDetail.id}`} />,
    },
  ];

  return (
    <InfosDialog
      open={open}
      onClose={onClose}
      icon={
        <ConversationAvatar
          sx={{ width: 'inherit', height: 'inherit' }}
          displayName={contactDetail.id || contactDetail.id}
        />
      }
      title={contactDetail.id}
      content={<DialogContentList title={t('contact_details_dialog_title')} items={items} />}
    />
  );
};

export default ContactDetailDialog;
