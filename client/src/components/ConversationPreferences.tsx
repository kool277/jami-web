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
  Card,
  CardContent,
  CardHeader,
  ClickAwayListener,
  InputAdornment,
  Popper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Message } from '@savoirfairelinux/jami-web-common'
import { motion, type Transition } from 'framer-motion'
import { memo, SetStateAction, use, useMemo, useState } from 'react'
import { BlockPicker, ColorResult } from 'react-color'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAuthContext } from '../contexts/AuthProvider.js'
import { useConversationPreferencesColorContext } from '../contexts/ConversationPreferencesColorContext.js'
import { useConversationPreferencesNotificationsContext } from '../contexts/ConversationPreferencesNotificationsContext.js'
import { useConversationPreferencesStateContext } from '../contexts/ConversationPreferencesStateContext.js'
import { useConversationContext } from '../contexts/ConversationProvider.js'
import { CustomThemeContext } from '../contexts/CustomThemeProvider.js'
import { ConversationMember } from '../models/conversation-member.js'
import { useBlockContactMutation, useContactQuery } from '../services/contactQueries.js'
import {
  useConversationPreferencesMutation,
  useMessagesQuery,
  useRemoveMemberFromSwarm,
} from '../services/conversationQueries.js'
import { messageColors } from '../utils/messagecolor.js'
import BaseButton from './common/BaseButton.js'
import BaseIconButton from './common/BaseIconButton.js'
import { ISLAND_MARGIN } from './common/Island.js'
import ContactDetailDialog from './ContactDetailDialog.js'
import ContextMenu, { ContextMenuHandler, useContextMenuHandler } from './ContextMenu.js'
import ConversationAvatar, { GroupConversationAvatar } from './ConversationAvatar.js'
import ConversationSettingsFileItem from './ConversationSettingsFileItem.js'
import { ConfirmationDialog, useDialogHandler } from './Dialog.js'
import EllipsisMiddle from './EllipsisMiddle.js'
import { PopoverListItemData } from './PopoverList.js'
import RemoveConversationDialog from './RemoveComversationDialog.js'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ColorsIcon,
  DescriptionIcon,
  ExitToAppIcon,
  FormatCodeIcon,
  GroupsIcon,
  MoreHorizIcon,
  NotificationsActiveIcon,
  NotificationsOffIcon,
  PermMediaIcon,
} from './SvgIcon.js'
import { BlockContactIcon, JamiIdIcon, KickMemberIcon, MessageIcon, PersonIcon } from './SvgIcon.js'

export type ConversationType = 'private' | 'group'

const readOnlyFieldSx = {
  '& .MuiInputBase-input': {
    caretColor: 'transparent',
    cursor: 'default',
  },
}

export function getConversationPreferencesTransition(animationsEnabled: boolean): Transition {
  return animationsEnabled ? { type: 'tween' as const, duration: 0.2, ease: 'easeOut' } : { duration: 0 }
}

export function getConversationType(memberCount: number): ConversationType {
  return memberCount > 2 ? 'group' : 'private'
}

export function getFilesByRecency(files: Message[]): Message[] {
  return [...files].sort((first, second) => second.timestamp - first.timestamp)
}

export function getRecentFiles(files: Message[], limit: number): Message[] {
  return getFilesByRecency(files).slice(0, limit)
}

export default function ConversationPreferences() {
  const { t } = useTranslation()
  const { animationsEnabled } = use(CustomThemeContext)
  const { isOpen } = useConversationPreferencesStateContext()
  const { members, conversationId, conversationDisplayName, conversationInfos } = useConversationContext()
  const { account } = useAuthContext()
  const theme = useTheme()
  const [attachmentsPageOpen, setAttachmentsPageOpen] = useState(false)

  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const isMedium: boolean = useMediaQuery(theme.breakpoints.only('sm'))
  const isMoreThanMedium: boolean = useMediaQuery(theme.breakpoints.only('md'))

  if (!isOpen) {
    return
  }

  const isAdmin = members.some((member) => member.contact.uri === account.getUri() && member.role === 'admin')
  const otherMember = members.find((member) => member.contact.uri !== account.getUri())

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
      style={{ width: getWidth(), minWidth: !(isMedium || isMobile) ? '350px' : 'unset' }}
      initial={{ scale: 1, x: 100 }}
      animate={{ scale: 1, x: 0 }}
      transition={getConversationPreferencesTransition(animationsEnabled)}
    >
      <Card
        sx={{
          backgroundColor: 'background.paper',
          height: 'calc(100vh - 16px)',
          margin: ISLAND_MARGIN,
          ml: 0,
          border: '0.5px solid',
          borderColor: 'divider',
          borderRadius: theme.Panel.borderRadius,
          boxShadow: theme.Panel.shadow,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {attachmentsPageOpen ? (
          <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, padding: 0 }}>
            <Box
              sx={{
                alignItems: 'center',
                color: 'text.primary',
                display: 'flex',
                gap: 1,
                justifyContent: 'flex-start',
                // Centers the 40px button on the panel's rounded corner arc.
                marginLeft: `calc(${theme.Panel.borderRadius} - 20px)`,
                marginTop: `calc(${theme.Panel.borderRadius} - 20px)`,
              }}
            >
              <BaseIconButton
                aria-label={t('conversation_files')}
                tooltip={t('conversation_files')}
                onClick={() => setAttachmentsPageOpen(false)}
                sx={{ height: '40px', width: '40px' }}
              >
                <ChevronLeftIcon aria-hidden sx={{ transform: theme.direction === 'rtl' ? 'scaleX(-1)' : undefined }} />
              </BaseIconButton>
              <Typography variant="h3">{t('conversation_files')}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flex: 1, minHeight: 0, pb: 2, pt: 1, px: 2 }}>
              <Files showAll={true} />
            </Box>
          </CardContent>
        ) : (
          <>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {Number(conversationInfos.mode) === 0 ? (
                    <ConversationAvatar
                      contactUri={otherMember?.contact.uri || ''}
                      sx={{ width: '160px', height: '160px' }}
                      displayName={conversationDisplayName}
                    />
                  ) : (
                    <GroupConversationAvatar
                      displayName={conversationDisplayName}
                      members={members}
                      src={conversationInfos.avatar}
                      sx={{ width: '160px', height: '160px' }}
                    />
                  )}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <ConversationNotificationToggle />
                    <ColorPicker conversationId={conversationId} />
                    <ConversationTypeIcon type={getConversationType(members.length)} />
                  </Box>
                </Box>
              }
              sx={{ justifyContent: 'center', '& .MuiCardHeader-content': { flex: 'initial' } }}
            />
            <ConversationDetailsFields isAdmin={isAdmin} />
            <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, paddingTop: 1 }}>
              <Box
                sx={{
                  alignItems: 'center',
                  color: 'text.primary',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PermMediaIcon aria-hidden />
                  <Typography variant="h3">{t('conversation_files')}</Typography>
                </Box>
                <BaseIconButton
                  aria-label={t('conversation_files')}
                  tooltip={t('conversation_files')}
                  onClick={() => setAttachmentsPageOpen(true)}
                >
                  <ChevronRightIcon aria-hidden />
                </BaseIconButton>
              </Box>
              <Box sx={{ marginTop: 1, display: 'flex', flex: 1, justifyContent: 'center', minHeight: 0 }}>
                <Files showAll={false} />
              </Box>
              <LeaveConversationAction />
            </CardContent>
          </>
        )}
      </Card>
    </motion.span>
  )
}

interface ConversationDetailsFieldsProps {
  isAdmin: boolean
}

const ConversationDetailsFields = ({ isAdmin }: ConversationDetailsFieldsProps) => {
  const { t } = useTranslation()
  const { conversationId, conversationDisplayName, conversationInfos, members } = useConversationContext()
  const isGroup = members.length > 2
  const { account } = useAuthContext()
  const otherMember = members.find((member) => member.contact.uri !== account.getUri())

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
      <Box sx={{ width: '95%', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <TextField
          fullWidth
          label={isGroup ? t('conversation_details_group_name') : t('contact_details_name')}
          size="small"
          value={conversationDisplayName}
          sx={readOnlyFieldSx}
          slotProps={{
            input: {
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  {isGroup ? <GroupsIcon aria-hidden /> : <PersonIcon aria-hidden />}
                </InputAdornment>
              ),
            },
          }}
        />
        {isGroup && (
          <TextField
            fullWidth
            label={t('conversation_details_description')}
            size="small"
            value={conversationInfos.description || ''}
            placeholder={t('conversation_details_no_description')}
            sx={readOnlyFieldSx}
            slotProps={{
              input: {
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <DescriptionIcon aria-hidden />
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
        {!isGroup && (
          <TextField
            fullWidth
            label={t('conversation_details_jami_id')}
            size="small"
            value={otherMember?.contact.uri || ''}
            sx={[readOnlyFieldSx, { '& .MuiInputBase-input': { fontFamily: 'monospace' } }]}
            slotProps={{
              input: {
                readOnly: true,
                startAdornment: (
                  <InputAdornment position="start">
                    <JamiIdIcon size={20} aria-hidden />
                  </InputAdornment>
                ),
              },
            }}
          />
        )}
        <TextField
          fullWidth
          label={t('conversation_details_swarm_id')}
          size="small"
          value={conversationId}
          sx={[readOnlyFieldSx, { '& .MuiInputBase-input': { fontFamily: 'monospace' } }]}
          slotProps={{
            input: {
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <FormatCodeIcon aria-hidden />
                </InputAdornment>
              ),
            },
          }}
        />
        {isGroup && <Members isAdmin={isAdmin} />}
      </Box>
    </Box>
  )
}

const ConversationNotificationToggle = () => {
  const { t } = useTranslation()
  const { conversationId } = useConversationContext()
  const { ignoreNotifications } = useConversationPreferencesNotificationsContext()
  const conversationPreferencesMutation = useConversationPreferencesMutation(conversationId)

  return (
    <BaseIconButton
      aria-label={t('mute_conversation')}
      aria-pressed={ignoreNotifications}
      tooltip={t('mute_conversation')}
      onClick={() => conversationPreferencesMutation.mutate({ ignoreNotifications: !ignoreNotifications })}
      sx={{ backgroundColor: ignoreNotifications ? 'action.selected' : 'transparent' }}
    >
      {ignoreNotifications ? <NotificationsOffIcon /> : <NotificationsActiveIcon />}
    </BaseIconButton>
  )
}

interface ConversationTypeIconProps {
  type: ConversationType
}

const ConversationTypeIcon = ({ type }: ConversationTypeIconProps) => {
  const { t } = useTranslation()

  return (
    <Box
      role="img"
      aria-label={t(type === 'group' ? 'conversation_type_group' : 'conversation_type_private')}
      sx={{ display: 'flex', justifyContent: 'center' }}
    >
      {type === 'group' ? <GroupsIcon aria-hidden /> : <PersonIcon aria-hidden />}
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
    <Box sx={{ display: 'flex', width: '100%', flexDirection: 'column', maxHeight: '180px', overflowY: 'auto' }}>
      {members.map((member) => {
        return <MemberInfo key={member.contact.uri} member={member} isAdmin={isAdmin} />
      })}
    </Box>
  )
}

interface MemberInfoProps {
  isAdmin: boolean
  member: ConversationMember
}

const MemberInfo = ({ member, isAdmin }: MemberInfoProps) => {
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
        key={member.contact.uri}
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
          {member.role && <Box sx={{ typography: 'caption' }}>{t(member.role)}</Box>}
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

interface FilesProps {
  showAll: boolean
}

const ATTACHMENT_PREVIEW_LIMIT = 6

export const Files = ({ showAll }: FilesProps) => {
  // TODO : Fetch store blob url of files alredy loaded
  // in the conversation to avoid loading them again
  const { conversationId } = useConversationContext()
  const messagesQuery = useMessagesQuery(conversationId, showAll)
  const files = (messagesQuery.data ?? []).filter((message) => message.fileId)
  const displayedFiles = showAll ? getFilesByRecency(files) : getRecentFiles(files, ATTACHMENT_PREVIEW_LIMIT)
  const { t } = useTranslation()

  if (messagesQuery.isLoading) {
    return null
  }

  if (messagesQuery.isSuccess && files.length === 0) {
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
        height: '100%',
        overflowY: showAll ? 'auto' : 'hidden',
        paddingBottom: '8px',
        overflowX: 'hidden',
        alignContent: 'start',
      }}
    >
      {displayedFiles.map((file) => {
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

const LeaveConversationAction = () => {
  const { t } = useTranslation()
  const RemoveConversationDialogHandler = useDialogHandler()
  const { conversationId } = useConversationContext()

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
        <BaseButton
          variant="contained"
          sx={{
            width: '90%',
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
        </BaseButton>
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

export const ColorPicker = ({ conversationId }: ColorPickerProps) => {
  const { t } = useTranslation()
  const theme = useTheme()
  const { conversationColor } = useConversationPreferencesColorContext()
  const [open, setOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const conversationPreferencesMutation = useConversationPreferencesMutation(conversationId)

  const handleNewColor = (color: string) => {
    conversationPreferencesMutation.mutate({ color })
  }

  const handleCloseColorPicker = () => {
    setAnchorEl(null)
    setOpen(false)
  }

  const handleOpenColorPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (open) {
      handleCloseColorPicker()
    } else {
      setAnchorEl(event.currentTarget)
      setOpen(true)
    }
  }

  return (
    <ClickAwayListener onClickAway={handleCloseColorPicker}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <BaseButton
            aria-label={t('conversation_color')}
            aria-expanded={open}
            onClick={(event) => handleOpenColorPicker(event)}
            variant="text"
            sx={{
              width: '30px',
              minWidth: 0,
              height: '30px',
              padding: 0,
              backgroundColor: conversationColor,
              borderRadius: '50%',
              color: theme.palette.getContrastText(conversationColor),
              '&:hover': { backgroundColor: conversationColor },
            }}
          >
            <ColorsIcon aria-hidden fontSize="small" />
          </BaseButton>
          <Popper sx={{ zIndex: 2 }} open={open} anchorEl={anchorEl} placement="bottom">
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
    </ClickAwayListener>
  )
}
