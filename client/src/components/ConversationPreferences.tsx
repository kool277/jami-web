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

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Popper,
  Switch,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Message } from '@savoirfairelinux/jami-web-common'
import { motion } from 'framer-motion'
import { memo, ReactElement, SetStateAction, useMemo, useState } from 'react'
import { BlockPicker, ColorResult } from 'react-color'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAuthContext } from '../contexts/AuthProvider.js'
import { useConversationPreferencesColorContext } from '../contexts/ConversationPreferencesColorContext.js'
import { useConversationPreferencesNotificationsContext } from '../contexts/ConversationPreferencesNotificationsContext.js'
import { useConversationPreferencesStateContext } from '../contexts/ConversationPreferencesStateContext.js'
import { useConversationContext } from '../contexts/ConversationProvider.js'
import { ConversationMember } from '../models/conversation-member.js'
import { useBlockContactMutation, useContactQuery } from '../services/contactQueries.js'
import {
  useConversationInfosMutation,
  useConversationPreferencesMutation,
  useGetAllFilesQuery,
  useRemoveMemberFromSwarm,
} from '../services/conversationQueries.js'
import { messageColors } from '../utils/messagecolor.js'
import ContactDetailDialog from './ContactDetailDialog.js'
import ContextMenu, { ContextMenuHandler, useContextMenuHandler } from './ContextMenu.js'
import ConversationAvatar from './ConversationAvatar.js'
import ConversationSettingsFileItem from './ConversationSettingsFileItem.js'
import { ConfirmationDialog, useDialogHandler } from './Dialog.js'
import EllipsisMiddle from './EllipsisMiddle.js'
import { PopoverListItemData } from './PopoverList.js'
import ProcessingRequest from './ProcessingRequest.js'
import RemoveConversationDialog from './RemoveComversationDialog.js'
import {
  AdminPanelSettingsIcon,
  AttachFileIcon,
  ExitToAppIcon,
  GroupsIcon,
  InfoOutlinedIcon as InfoIcon,
  MoreHorizIcon,
} from './SvgIcon.js'
import { BlockContactIcon, KickMemberIcon, MessageIcon, PersonIcon } from './SvgIcon.js'

enum TABS {
  MEMBERS = 0,
  FILES = 1,
  SETTINGS = 2,
  INFOS = 3,
}

export default function ConversationPreferences() {
  const { conversationColor } = useConversationPreferencesColorContext()
  const { isOpen } = useConversationPreferencesStateContext()
  const { members, conversationId, conversationDisplayName, conversationInfos } = useConversationContext()
  const { account } = useAuthContext()
  const useConversationInfosMutationQuery = useConversationInfosMutation(conversationId)
  const theme = useTheme()

  const [title, setTitle] = useState(conversationDisplayName)
  const [currentTab, setCurrentTab] = useState<TABS>(TABS.INFOS)

  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const isMedium: boolean = useMediaQuery(theme.breakpoints.only('sm'))
  const isMoreThanMedium: boolean = useMediaQuery(theme.breakpoints.only('md'))

  if (!isOpen) {
    return
  }

  const isAdmin = members.some((member) => member.contact.uri === account.getUri() && member.role === 'admin')

  const buttonStyle = {
    backgroundColor: 'inherit',
    color: theme.palette.text.primary,
    border: 'none',
    margin: '0 5px',
    height: '40px',
    '&:hover': { backgroundColor: 'inherit' },
  }

  const onTitleValidation = () => {
    useConversationInfosMutationQuery.mutate({ title })
  }

  const onTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value)
  }

  const onTitleAbort = () => {
    setTitle(conversationDisplayName)
  }

  function getWidth(): string {
    if (isMobile) {
      return '100vw'
    } else if (isMedium || isMoreThanMedium) {
      return '100%'
    } else {
      return '350px'
    }
  }

  return (
    <motion.span
      style={{ width: getWidth(), marginLeft: '-0.2vw', minWidth: !(isMedium || isMobile) ? '350px' : 'unset' }}
      initial={{ scale: 1, x: 100 }}
      animate={{ scale: 1, x: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      <Card
        sx={{
          backgroundColor: theme.ConversationPreferences.backgroundColor,
          height: 'calc(100vh - 16px)',
          margin: '8px',
          ml: 0,
          border: theme.ConversationPreferences.border,
          borderRadius: theme.Panel.borderRadius,
          boxShadow: theme.Panel.shadow,
          fontSize: '15px',
          overflow: 'hidden',
        }}
      >
        <CardHeader
          title={
            <Input
              disabled={!isAdmin}
              onChange={onTitleChange}
              value={title}
              onAbort={() => {
                setTitle(conversationDisplayName)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onTitleValidation()
                } else if (event.key === 'Escape') {
                  onTitleAbort()
                }
              }}
            />
          }
          avatar={
            <ConversationAvatar
              contactUri={
                conversationInfos.mode && conversationInfos.mode === '0'
                  ? members.filter((member) => member.contact.uri !== account.getUri())[0].contact.uri
                  : ''
              }
              sx={{ width: '45px', height: '45px' }}
              displayName={conversationDisplayName}
            />
          }
          sx={{ backgroundColor: conversationColor, height: '12%', borderRadius: '12px' }}
        />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '1vh' }}>
            <Button
              sx={buttonStyle}
              style={{ opacity: currentTab === TABS.INFOS ? 1 : 0.7 }}
              onClick={() => {
                setCurrentTab(TABS.INFOS)
              }}
            >
              <InfoIcon />
            </Button>
            {members.length > 2 && (
              <Button
                sx={buttonStyle}
                style={{ opacity: currentTab === TABS.MEMBERS ? 1 : 0.7 }}
                onClick={() => {
                  setCurrentTab(TABS.MEMBERS)
                }}
              >
                <GroupsIcon />
              </Button>
            )}

            <Button
              sx={buttonStyle}
              style={{ opacity: currentTab === TABS.FILES ? 1 : 0.7 }}
              onClick={() => {
                setCurrentTab(TABS.FILES)
              }}
            >
              <AttachFileIcon />
            </Button>
            <Button
              sx={buttonStyle}
              style={{ opacity: currentTab === TABS.SETTINGS ? 1 : 0.7 }}
              onClick={() => {
                setCurrentTab(TABS.SETTINGS)
              }}
            >
              <AdminPanelSettingsIcon />
            </Button>
          </Box>
          <Box sx={{ marginTop: '10%', display: 'flex', justifyContent: 'center' }}>
            {currentTab === TABS.INFOS && <Infos />}
            {currentTab === TABS.MEMBERS && <Members isAdmin={isAdmin} />}
            {currentTab === TABS.FILES && <Files />}
            {currentTab === TABS.SETTINGS && <Settings />}
          </Box>
        </CardContent>
      </Card>
    </motion.span>
  )
}

interface SettingsItemWrapperProps {
  title: string
  children?: ReactElement
}

const SettingsItemWrapper = ({ title, children }: SettingsItemWrapperProps) => {
  return (
    <Box
      sx={{
        width: '95%',
        margin: '1px',
        paddingTop: '2%',
        paddingBottom: '2%',
        display: 'flex',
        justifyContent: 'space-between',
        borderRadius: '2px',
      }}
    >
      <Box sx={{ textWrap: 'nowrap' }}>{title}</Box>
      <Box>{children}</Box>
    </Box>
  )
}

const Infos = () => {
  const { t } = useTranslation()
  const { conversationId, conversationInfos, members } = useConversationContext()
  const conversationType = members.length > 2 ? t('conversation_type_group') : t('conversation_type_private')
  const { account } = useAuthContext()
  const [description, setDescription] = useState(conversationInfos.description || '')
  const useConversationInfosMutationQuery = useConversationInfosMutation(conversationId)
  const isAdmin = members.some((member) => member.contact.uri === account.getUri() && member.role === 'admin')
  const isMedium = useMediaQuery(useTheme().breakpoints.only('sm'))

  const onDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(event.target.value)
  }
  const onDescriptionValidation = () => {
    useConversationInfosMutationQuery.mutate({ description })
  }

  const onDescriptionAbort = () => {
    setDescription(conversationInfos.description || '')
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center',
        width: '100%',
      }}
    >
      <SettingsItemWrapper title="Description">
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <Input
            type="text"
            disabled={!isAdmin}
            onChange={onDescriptionChange}
            sx={{ maxWidth: '80%', textWrap: 'wrap', marginTop: '-6px' }}
            value={description}
            onAbort={() => {
              setDescription(conversationInfos.description || '')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onDescriptionValidation()
              } else if (event.key === 'Escape') {
                onDescriptionAbort()
              }
            }}
          />
        </Box>
      </SettingsItemWrapper>
      {/* <SettingsItemWrapper title='Secure peer-to-peer connection'><LockIcon/></SettingsItemWrapper> */}
      <SettingsItemWrapper title={t('conversation_type')}>
        <Box>{conversationType}</Box>
      </SettingsItemWrapper>
      <SettingsItemWrapper title="Swarm ID">
        <Box
          sx={{
            maxWidth: isMedium ? '220px' : '180px',
            marginRight: '-15px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
          }}
        >
          <EllipsisMiddle text={conversationId} />
        </Box>
      </SettingsItemWrapper>
    </Box>
  )
}

interface ContactMenuProps {
  isBanned: boolean
  isAdmin: boolean
  currentConversationId: string
  conversationId?: string
  memberUri: string
  contextMenuProps: ContextMenuHandler['props']
  openContactDialog: () => void
  setIsBlocking: React.Dispatch<SetStateAction<boolean>>
  setContactDetailDialogOpen: React.Dispatch<SetStateAction<boolean>>
}

const ContactMenu = ({
  isBanned,
  isAdmin,
  currentConversationId,
  conversationId,
  memberUri,
  contextMenuProps,
  openContactDialog,
  setIsBlocking,
  setContactDetailDialogOpen,
}: ContactMenuProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const kickMemberMutation = useRemoveMemberFromSwarm(currentConversationId)
  const menuOptions: PopoverListItemData[] = useMemo(() => {
    const options: PopoverListItemData[] = [
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
    ]

    return [
      ...(conversationId
        ? [
            {
              label: t('go_to_conversation'),
              Icon: MessageIcon,
              onClick: () => {
                navigate(`/conversation/${conversationId}`)
              },
            },
          ]
        : []),
      ...options,
      ...(isAdmin && !isBanned
        ? [
            {
              label: t('kick_member'),
              Icon: KickMemberIcon,
              onClick: () => {
                kickMemberMutation.mutate(memberUri)
              },
            },
          ]
        : []),
    ]
  }, [
    conversationId,
    isAdmin,
    isBanned,
    kickMemberMutation,
    memberUri,
    navigate,
    openContactDialog,
    setContactDetailDialogOpen,
    setIsBlocking,
    t,
  ])

  return <ContextMenu {...contextMenuProps} items={menuOptions} />
}

interface ContactDialogProps {
  isBlocking: boolean
  open: boolean
  closeContactDialog: () => void
  currentContactId: string
}

const ContactDialog = memo(({ open, closeContactDialog, currentContactId }: ContactDialogProps) => {
  const blockContactMutation = useBlockContactMutation()

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
      content={t('contact_ask_confirm_block')}
      onConfirm={blockContact}
      confirmButtonText={t('contact_confirm_block')}
    />
  )
})

interface MembersProps {
  isAdmin: boolean
}

const Members = ({ isAdmin }: MembersProps) => {
  const { members } = useConversationContext()
  return (
    <Box sx={{ display: 'flex', width: '100%', flexDirection: 'column', height: '60vh', overflowY: 'scroll' }}>
      {members.map((member, index) => {
        return <MemberInfo key={index} member={member} isAdmin={isAdmin} />
      })}
    </Box>
  )
}

interface MemberInfoProps {
  isAdmin: boolean
  member: ConversationMember
  key: number
}

const MemberInfo = ({ member, key, isAdmin }: MemberInfoProps) => {
  const [isBlocking, setIsBlocking] = useState(true)
  const { account } = useAuthContext()
  const [contactDetailDialogOpen, setContactDetailDialogOpen] = useState<boolean>(false)
  const singleContactQuery = useContactQuery(member.contact.uri)
  const { conversationId: currentConversationId } = useConversationContext()
  const { data: contactDetail } = singleContactQuery
  const contextMenuHandler = useContextMenuHandler()
  const isBanned = member.role === 'banned'
  const { t } = useTranslation()
  const isMobile = useMediaQuery(useTheme().breakpoints.only('xs'))
  const isMedium = useMediaQuery(useTheme().breakpoints.only('sm'))

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

  const bestName = member.getDisplayName() || member.contact.registeredName || member.contact.uri

  const getBestWidth = () => {
    if (isMobile) {
      return '165px'
    }
    if (isMedium) {
      return '140px'
    }
    return '135px'
  }

  return (
    <>
      <ContactDialog
        isBlocking={isBlocking}
        open={dialogOpen}
        closeContactDialog={closeContactDialog}
        currentContactId={member.contact.uri}
      />
      {ContactDetailDialogElement}
      <ContactMenu
        memberUri={member.contact.uri}
        isBanned={isBanned}
        isAdmin={isAdmin}
        currentConversationId={currentConversationId}
        conversationId={contactDetail?.conversationId}
        contextMenuProps={contextMenuHandler.props}
        openContactDialog={openContactDialog}
        setIsBlocking={setIsBlocking}
        setContactDetailDialogOpen={setContactDetailDialogOpen}
      />
      <Box
        key={key}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          padding: '2%',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {' '}
          <ConversationAvatar presence={true} contactUri={member.contact.uri} displayName={bestName} />
          <Box
            sx={{
              maxWidth: getBestWidth,
              marginLeft: '8px',
            }}
          >
            {bestName.length > 15 ? <EllipsisMiddle text={bestName} /> : bestName}
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            minWidth: isMedium ? '120px' : '105px',
          }}
        >
          {member.role && <Box sx={{ fontSize: 'smaller' }}>{t(member.role)}</Box>}
          <MoreHorizIcon
            sx={{
              '&:hover': { cursor: 'pointer' },
              visibility: member.contact.uri === account.getUri() ? 'hidden' : 'visible',
            }}
            onClick={(e) => {
              if (member.contact.uri === account.getUri()) return
              contextMenuHandler.handleAnchorPosition(e)
            }}
          />
        </Box>
      </Box>
    </>
  )
}

const Files = () => {
  // TODO : Fetch store blob url of files alredy loaded
  // in the conversation to avoid loading them again
  const { conversationId } = useConversationContext()
  const filesQuery = useGetAllFilesQuery(conversationId)
  const files = filesQuery.data
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.only('xs'))

  if (filesQuery.isLoading) {
    ;<ProcessingRequest open={true} />
  }

  if (filesQuery.isSuccess && files.length === 0) {
    return (
      <Box>
        <Typography>{t('no_files_found')}</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        width: '100%',
        height: isMobile ? 'calc(70vh - 30px)' : '70vh',
        overflowY: 'auto',
        paddingBottom: '8px',
        overflowX: 'hidden',
        alignContent: 'start',
      }}
    >
      {files?.map((file: Message) => {
        return (
          <ConversationSettingsFileItem
            key={file.id + file.fileId}
            displayName={file?.displayName || ''}
            timeStamp={file.timestamp}
            totalSize={Number(file?.totalSize) || 0}
            fileId={file?.fileId || ''}
            author={file.author}
            messageId={file.id}
          />
        )
      })}
    </Box>
  )
}

const Settings = () => {
  const { t } = useTranslation()
  const RemoveConversationDialogHandler = useDialogHandler()
  const { conversationId } = useConversationContext()
  const conversationPreferencesMutation = useConversationPreferencesMutation(conversationId)
  const { ignoreNotifications } = useConversationPreferencesNotificationsContext()

  const onConversationMuteChange = () => {
    conversationPreferencesMutation.mutate({ ignoreNotifications: !ignoreNotifications })
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          alignContent: 'center',
          width: '100%',
        }}
      >
        <SettingsItemWrapper title={t('conversation_color')}>
          <Box sx={{ marginRight: '13px' }}>
            <ColorPicker conversationId={conversationId} />
          </Box>
        </SettingsItemWrapper>
        <SettingsItemWrapper title={t('mute_conversation')}>
          <Switch onChange={onConversationMuteChange} checked={ignoreNotifications} />
        </SettingsItemWrapper>

        <Button
          variant="contained"
          sx={{
            width: '90%',
            marginTop: '5%',
            backgroundColor: 'red',
            display: 'flex',
            justifyContent: 'space-evenly',
            '&:hover': { backgroundColor: 'red' },
            maxWidth: '200px',
          }}
          onClick={() => {
            RemoveConversationDialogHandler.openDialog()
          }}
        >
          {t('leave_conversation')}
          <ExitToAppIcon />
        </Button>
      </Box>
      <RemoveConversationDialog
        {...RemoveConversationDialogHandler.props}
        conversationId={conversationId}
        isCurrent={true} // indicates if we are in the conversation we want to remove
      />
    </>
  )
}

interface ColorPickerProps {
  conversationId: string
}

const ColorPicker = ({ conversationId }: ColorPickerProps) => {
  const { conversationColor } = useConversationPreferencesColorContext()
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const conversationPreferencesMutation = useConversationPreferencesMutation(conversationId)

  const handleNewColor = (color: string) => {
    conversationPreferencesMutation.mutate({ color })
  }

  const handleOpenColorPicker = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget)
    setOpen((prev) => !prev)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box
          component="div"
          onClick={(event) => handleOpenColorPicker(event)}
          sx={{
            width: '30px',
            height: '30px',
            backgroundColor: conversationColor,
            borderRadius: '50%',
            '&:hover': { cursor: 'pointer' },
          }}
        >
          <Popper open={open} anchorEl={anchorEl} placement="bottom">
            <BlockPicker
              triangle="hide"
              styles={{}}
              color={conversationColor}
              colors={messageColors}
              onChange={(color: ColorResult) => {
                handleNewColor(color.hex)
              }}
            />
          </Popper>
        </Box>
      </Box>
    </Box>
  )
}
