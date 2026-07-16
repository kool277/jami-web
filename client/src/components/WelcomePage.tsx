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
  IconButton,
  Link,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React, { use, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider.js'
import { useAuthContext } from '../contexts/AuthProvider.js'
import { CustomThemeContext } from '../contexts/CustomThemeProvider.js'
import { useMobileMenuStateContext } from '../contexts/MobileMenuStateProvider.js'
import JamiLogo from '../icons/logo-jami-net.svg?react'
import JamiLogoWhite from '../icons/logo-jami-net-white.svg?react'
import {
  contributorsCommunityManagement,
  contributorsDevelopers,
  contributorsMedia,
  contributorsSpecialThanks,
} from '../utils/contributors.js'
import BaseButton from './common/BaseButton.js'
import BaseModalDialog from './common/BaseModalDialog.js'
import EllipsisMiddle from './EllipsisMiddle.js'
import { VolunteerActivismIcon } from './SvgIcon.js'
import {
  ContentCopyIcon,
  FavoriteBorderIcon,
  FeedbackIcon,
  InfoIcon,
  JamiIdIcon,
  TipIcon,
  TrashBinIcon,
  TwoSheetsIcon,
} from './SvgIcon.js'

export default function WelcomePage() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { account } = useAuthContext()
  const { setAlertContent } = use(AlertSnackbarContext)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const { setIsMenuOpen } = useMobileMenuStateContext()
  const isReduced: boolean = useMediaQuery(theme.breakpoints.down('lg'))
  const isMedium: boolean = useMediaQuery(theme.breakpoints.down(1000))
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const [isDisabled] = useState(() => localStorage.getItem('disable-tips') === 'true')

  const { mode } = use(CustomThemeContext)
  const isDark = mode === 'dark'
  const hasToRegisterName = account.getRegisteredName() === undefined
  const [displayedInfo, setDisplayedInfo] = useState(hasToRegisterName ? account.getUri() : account.getRegisteredName())

  if (isMobile) {
    setIsMenuOpen(true)
  }

  const [informationsTips, setInformationsTips] = useState([
    {
      icon: <TipIcon style={{ color: theme.WelcomePage.iconsColor }} />,
      title: 'Tip',
      text: 'What information do I need to provide to create a Jami account?',
      hiddenTitle: 'What information do I need to provide to create a Jami account?',
      hiddenText: '',
    },
    {
      icon: <TipIcon style={{ color: theme.WelcomePage.iconsColor }} />,
      title: 'Tip',
      text: 'What is the green dot next to my username?',
      hiddenTitle: 'What is the green dot next to my username?',
      hiddenText:
        "A red dot means that your account is disconnected from the network. It turns green when it's connected",
    },
    {
      icon: <TipIcon style={{ color: theme.WelcomePage.iconsColor }} />,
      title: 'Tip',
      text: 'What is a Jami account?',
      hiddenTitle: 'What is a Jami account?',
      hiddenText:
        'A jami account is an asymmetric encryption key. Your account is identified by a Jami ID which is the fingerprint of your public key.',
    },
    {
      icon: <TipIcon style={{ color: theme.WelcomePage.iconsColor }} />,
      title: 'Tip',
      text: 'Can I use my account on multiple devices?',
      hiddenTitle: 'Can I use my account on multiple devices?',
      hiddenText: 'Yes you can link your account from the settings or you can import your account on the login page.',
    },
    {
      icon: <TipIcon style={{ color: theme.WelcomePage.iconsColor }} />,
      title: 'Tip',
      text: 'What does Jami mean?',
      hiddenTitle: 'What does Jami mean?',
      hiddenText:
        'The choice of the name Jami was inspired by the Swahili word "jamii", which means "community" as a noun and "together" as an adverb.',
    },
  ])

  const handleMoreInfo = () => {
    if (hasToRegisterName) {
      //cannot switch between uri and registered name if registered name is undefined
      return
    }

    if (displayedInfo === account.getRegisteredName()) {
      setDisplayedInfo(account.getUri())
    } else {
      setDisplayedInfo(account.getRegisteredName())
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedInfo)
    setAlertContent({
      messageI18nKey: 'copied_to_clipboard',
      severity: 'success',
      alertOpen: true,
    })
  }

  const handleCopyVersion = async () => {
    try {
      await navigator.clipboard.writeText(`${__GIT_COMMIT_HASH__}-${__JAMI_CORE_VERSION__}`)
    } catch {
      return
    }

    setAlertContent({
      messageI18nKey: 'copied_to_clipboard',
      severity: 'success',
      alertOpen: true,
    })
  }

  const middleBoxStyle = {
    backgroundColor: theme.WelcomePage.middleBoxBackgroundColor,
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    color: theme.WelcomePage.iconsColor,
    boxSizing: 'border-box',
  }

  const getAmountOfBox = () => {
    if (isMedium) {
      return 0
    }
    if (isReduced) {
      return 1
    }
    return 2
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '80%',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isDark ? (
              <JamiLogoWhite width={'auto'} height={'80px'} style={{ marginTop: '100px', marginBottom: '150px' }} />
            ) : (
              <JamiLogo width={'auto'} height={'80px'} style={{ marginTop: '100px', marginBottom: '150px' }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '-9vh' }}>
            <Typography
              sx={{
                color: 'text.primary',
              }}
            >
              {t('welcome_page_text')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '2%', width: '100%' }}>
            <Box
              sx={{
                borderRadius: '18px 2px 2px 18px',
                ...middleBoxStyle,
                maxWidth: isMedium ? '220px' : 'unset',
                width: 'auto',
              }}
            >
              <JamiIdIcon sx={{ marginRight: '5px' }} />
              <Box
                sx={{
                  maxWidth: isMedium ? '170px' : 'unset',
                  mb: '2px',
                }}
              >
                <EllipsisMiddle text={displayedInfo} centerItem={true} padding="6px" />
              </Box>
            </Box>
            <Box
              sx={{
                borderRadius: '2px 18px 18px 2px',
                ...middleBoxStyle,
                gap: '10px',
              }}
            >
              <Tooltip title={t('copy_to_clipboard')}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TwoSheetsIcon sx={{ fontSize: '20px', '&:hover': { cursor: 'pointer' } }} onClick={handleCopy} />
                </span>
              </Tooltip>
              <Tooltip
                title={
                  displayedInfo === account.getRegisteredName()
                    ? t('welcome_page_view_uri')
                    : hasToRegisterName
                      ? t('welcome_page_register_username')
                      : t('welcome_page_view_registered_name')
                }
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <InfoIcon sx={{ fontSize: '20px', '&:hover': { cursor: 'pointer' } }} onClick={handleMoreInfo} />
                </span>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
            <WelcomeBox
              key={-1}
              icon={<VolunteerActivismIcon style={{ color: theme.WelcomePage.iconsColor }} />}
              title={'Donate'}
              text="Free and private sharing. Donate to expand it."
              hiddenText=""
              hiddenTitle=""
              onRemove={() => {}}
              onClickAction={() => {
                window.open('https://jami.net/donate/')
              }}
            ></WelcomeBox>
            {!isDisabled &&
              informationsTips.slice(0, getAmountOfBox()).map((infoTip) => (
                <WelcomeBox
                  key={infoTip.text}
                  icon={infoTip.icon}
                  title={infoTip.title}
                  text={infoTip.text}
                  hiddenTitle={infoTip.hiddenTitle}
                  hiddenText={infoTip.hiddenText}
                  onRemove={() => {
                    const updatedTips = informationsTips.filter((tip) => tip !== infoTip)
                    setInformationsTips(updatedTips)
                  }}
                />
              ))}
          </Box>
        </Box>
        <BaseButton
          variant="text"
          startIcon={<InfoIcon />}
          sx={{ marginBottom: '16px' }}
          onClick={() => setIsAboutOpen(true)}
        >
          {t('about_jami')}
        </BaseButton>
      </Box>
      <BaseModalDialog
        open={isAboutOpen}
        selectedValue=""
        title={t('about_jami')}
        onClose={() => setIsAboutOpen(false)}
        closePolicy={['escapeKeyDown', 'backdropClick']}
        dialogWidth="500px"
        actions={
          <>
            <BaseButton
              variant="text"
              startIcon={<FavoriteBorderIcon />}
              onClick={() => {
                window.open('https://jami.net/donate/', '_blank', 'noopener,noreferrer')
              }}
            >
              {t('donate')}
            </BaseButton>
            <BaseButton
              variant="text"
              startIcon={<VolunteerActivismIcon />}
              onClick={() => {
                window.open('https://jami.net/contribute/', '_blank', 'noopener,noreferrer')
              }}
            >
              {t('contribute')}
            </BaseButton>
            <BaseButton
              variant="text"
              startIcon={<FeedbackIcon />}
              onClick={() => {
                window.open('mailto:jami@gnu.org')
              }}
            >
              {t('feedback')}
            </BaseButton>
          </>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', minWidth: 0 }}>
          <Box sx={{ boxSizing: 'border-box', flex: '1 1 0', minWidth: 0, paddingRight: '8px' }}>
            {isDark ? (
              <JamiLogoWhite style={{ display: 'block', height: 'auto', width: '100%' }} />
            ) : (
              <JamiLogo style={{ display: 'block', height: 'auto', width: '100%' }} />
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: theme.WelcomePage.infoBackgroundColor,
              borderRadius: '12px',
              maxWidth: '100%',
              minWidth: '180px',
              padding: '8px',
              width: 'fit-content',
            }}
          >
            <Typography sx={{ fontWeight: 'bolder' }}>Euclid</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'grey' }}>
                  {t('version')} :{' '}
                  <Box component="span" sx={{ fontFamily: 'monospace' }}>
                    {__GIT_COMMIT_HASH__}
                  </Box>
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey' }}>
                  Core:{' '}
                  <Box component="span" sx={{ fontFamily: 'monospace' }}>
                    {__JAMI_CORE_VERSION__}
                  </Box>
                </Typography>
              </Box>
              <Tooltip title={t('copy_to_clipboard')}>
                <IconButton
                  onClick={handleCopyVersion}
                  size="small"
                  sx={{ marginRight: '-5px' }}
                  aria-label={t('copy_to_clipboard')}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
        <Box sx={{ marginBottom: '24px' }}>
          <Typography variant="body2">
            <Trans
              i18nKey="about_jami_text"
              components={{ jamiLink: <Link href="https://jami.net/" rel="noreferrer" target="_blank" /> }}
            />
          </Typography>
          <Typography variant="body2" sx={{ marginTop: '8px' }}>
            <Trans
              i18nKey="about_jami_text_warranty"
              components={{
                gplLink: <Link href="https://www.gnu.org/licenses/gpl-3.0.html" rel="noreferrer" target="_blank" />,
              }}
            />
          </Typography>
          <Typography variant="body2" sx={{ marginTop: '8px' }}>
            © 2015-2025 <Link href="https://savoirfairelinux.com/">Savoir-faire Linux</Link>
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: theme.WelcomePage.infoBackgroundColor,
            borderRadius: '12px',
            maxHeight: '240px',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              boxSizing: 'border-box',
              maxHeight: '240px',
              overflowY: 'auto',
              padding: '12px',
              scrollbarGutter: 'stable',
            }}
          >
            <Typography sx={{ fontWeight: 'bolder', marginBottom: '8px' }}>{t('developers')}</Typography>
            {contributorsDevelopers.map((contributor) => (
              <Typography variant="body2" key={contributor}>
                {contributor}
              </Typography>
            ))}
            <br />
            <Typography sx={{ fontWeight: 'bolder', marginBottom: '8px' }}>{t('media')}</Typography>
            {contributorsMedia.map((contributor) => (
              <Typography variant="body2" key={contributor}>
                {contributor}
              </Typography>
            ))}
            <br />
            <Typography sx={{ fontWeight: 'bolder', marginBottom: '8px' }}>{t('community_management')}</Typography>
            {contributorsCommunityManagement.map((contributor) => (
              <Typography variant="body2" key={contributor}>
                {contributor}
              </Typography>
            ))}
            <br />
            <Typography sx={{ fontWeight: 'bolder', marginBottom: '8px' }}>{t('special_thanks_to')}</Typography>
            {contributorsSpecialThanks.map((contributor) => (
              <Typography variant="body2" key={contributor}>
                {contributor}
              </Typography>
            ))}
            <br />
            <Typography variant="body2">{t('about_jami_text_volunteers')}</Typography>
          </Box>
        </Box>
      </BaseModalDialog>
    </Box>
  )
}

interface WelcomeBoxProps {
  icon: React.ReactNode
  title: string
  text: string
  hiddenTitle: string
  hiddenText: string
  onRemove: () => void
  onClickAction?: () => void
}

const WelcomeBox = ({ icon, title, text, hiddenTitle, hiddenText, onRemove, onClickAction }: WelcomeBoxProps) => {
  const theme = useTheme()
  const [isReturned, setIsReturned] = useState(false)

  return (
    // TODO : make this component responsive
    <>
      {!isReturned ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
            perspective: '1000px',
          }}
        >
          <Card
            onClick={() => {
              if (onClickAction) {
                onClickAction()
                return
              }
              setIsReturned(true)
            }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.WelcomePage.tipsBackgroundColor,
              width: '260px',
              height: '200px',
              margin: '10px',
              transition: 'transform 0.6s',
              transformStyle: 'preserve-3d',
              '&:hover': {
                backgroundColor: theme.WelcomePage.tipsHoverBackgroundColor,
                cursor: 'pointer',
              },
              transform: isReturned ? 'rotateY(180deg)' : 'none',
            }}
          >
            <CardHeader
              avatar={<span style={{ overflow: 'visible', color: theme.palette.primary.dark }}>{icon}</span>}
              title={
                <Typography
                  sx={{
                    fontWeight: 'bolder',
                  }}
                >
                  {title}
                </Typography>
              }
            />
            <CardContent>
              <Typography>{text}</Typography>
            </CardContent>
          </Card>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
            perspective: '1000px',
          }}
        >
          <Card
            onClick={() => setIsReturned(false)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.WelcomePage.tipsBackgroundColor,
              width: '260px',
              height: '200px',
              margin: '10px',
              transition: 'transform 0.6s',
              transformStyle: 'preserve-3d',
              transform: 'rotateY(180deg)',
              '&:hover': {
                cursor: 'pointer',
              },
            }}
          >
            <CardHeader
              sx={{ transform: 'rotateY(180deg)' }}
              title={
                <Typography
                  sx={{
                    fontWeight: 'bolder',
                  }}
                >
                  {hiddenTitle}
                </Typography>
              }
            />
            <CardContent>
              <Typography sx={{ transform: 'rotateY(180deg)' }}>{hiddenText}</Typography>
            </CardContent>
          </Card>
          <Box sx={{ height: '' }}>
            <TrashBinIcon
              sx={{ '&:hover': { cursor: 'pointer' } }}
              onClick={() => {
                setIsReturned(false)
                onRemove()
              }}
            />
          </Box>
        </Box>
      )}
    </>
  )
}
