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
  Link,
  Modal,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React, { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertSnackbarContext } from '../contexts/AlertSnackbarProvider'
import { useAuthContext } from '../contexts/AuthProvider'
import { CustomThemeContext } from '../contexts/CustomThemeProvider'
import { useMobileMenuStateContext } from '../contexts/MobileMenuStateProvider'
import JamiLogo from '../icons/logo-jami-net.svg?react'
import JamiLogoWhite from '../icons/logo-jami-net-white.svg?react'
import { contributorsDevelopers, contributorsMedia } from '../utils/contributors'
import EllipsisMiddle from './EllipsisMiddle'
import { VolunteerActivismIcon } from './SvgIcon'
import { InfoIcon, JamiIdIcon, TipIcon, TrashBinIcon, TwoSheetsIcon } from './SvgIcon'

export default function WelcomePage() {
  const { t } = useTranslation()
  const theme = useTheme()
  const { account } = useAuthContext()
  const { setAlertContent } = useContext(AlertSnackbarContext)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const { setIsMenuOpen } = useMobileMenuStateContext()
  const isReduced: boolean = useMediaQuery(theme.breakpoints.down('lg'))
  const isMedium: boolean = useMediaQuery(theme.breakpoints.down(1000))
  const isMobile: boolean = useMediaQuery(theme.breakpoints.only('xs'))
  const isDisabled = localStorage.getItem('disable-tips') === 'true'

  const { mode } = useContext(CustomThemeContext)
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

  const middleBoxStyle = {
    backgroundColor: theme.WelcomePage.middleBoxBackgroundColor,
    padding: '0.4%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    color: theme.WelcomePage.iconsColor,
    height: '30px',
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
            <JamiLogo width={'auto'} height={'80px'} style={{ marginTop: '100px', marginBottom: '150px' }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '-9vh' }}>
            <Typography color={'black'}>{t('welcome_page_text')}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '2%', width: '100%' }}>
            <Box
              sx={{
                ...middleBoxStyle,
                maxWidth: isMedium ? '220px' : 'unset',
                width: 'auto',
              }}
              borderRadius={'5px 2px 2px 5px'}
            >
              <JamiIdIcon sx={{ marginBottom: '-4px', marginRight: '5px' }} />
              <Box maxWidth={isMedium ? '170px' : 'unset'} sx={{ mb: '2px' }}>
                <EllipsisMiddle text={displayedInfo} centerItem={true} padding="6px" />
              </Box>
            </Box>
            <Box sx={{ ...middleBoxStyle, gap: '8px', width: '65px' }} borderRadius={'2px 5px 5px 2px'} width={'6%'}>
              <Tooltip title={t('copy_to_clipboard')}>
                <span style={{ width: '20px', height: '20px' }}>
                  <TwoSheetsIcon
                    sx={{ width: '20px', height: '20px', '&:hover': { cursor: 'pointer' }, pl: '4px' }}
                    onClick={handleCopy}
                  />
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
                <span style={{ width: '20px', height: '20px' }}>
                  <InfoIcon
                    sx={{ width: '20px', height: '20px', '&:hover': { cursor: 'pointer' }, pr: '4px' }}
                    onClick={handleMoreInfo}
                  />
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
              informationsTips.slice(0, getAmountOfBox()).map((infoTip, index) => (
                <WelcomeBox
                  key={index}
                  icon={infoTip.icon}
                  title={infoTip.title}
                  text={infoTip.text}
                  hiddenTitle={infoTip.hiddenTitle}
                  hiddenText={infoTip.hiddenText}
                  onRemove={() => {
                    const updatedTips = informationsTips.filter((_, i) => i !== index)
                    setInformationsTips(updatedTips)
                  }}
                />
              ))}
          </Box>
        </Box>
        <Button
          sx={{ backgroundColor: 'transparent', marginBottom: '16px' }}
          onClick={() => {
            setIsAboutOpen(true)
          }}
        >
          {t('about_jami')}
        </Button>
      </Box>
      <Modal
        open={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        sx={{
          width: '450px',
          height: '600px',
          position: 'absolute',
          top: '50%',
          left: '59%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          borderRadius: '15px',
          border: 'none',
          backgroundColor: theme.ChatInterface.panelColor,
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.ChatInterface.panelColor,
            borderRadius: '15px',
            padding: '10px',
            display: 'flex',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 'bolder', marginLeft: '3%', marginTop: '3%' }} variant="h5">
              {t('about_jami')}
            </Typography>
            <Button
              onClick={() => {
                setIsAboutOpen(false)
              }}
            >
              X
            </Button>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              marginTop: '10%',
              height: '20%',
              marginLeft: '5%',
              marginRight: '5%',
              justifyContent: 'space-between',
              alignContent: 'center',
            }}
          >
            <Box sx={{ display: 'flex', maxWidth: '200px', width: 'auto' }}>
              {isDark ? (
                <JamiLogoWhite width={'auto'} height={'50px'} style={{ marginBottom: '50px', marginTop: '8px' }} />
              ) : (
                <JamiLogo width={'auto'} height={'50px'} style={{ marginBottom: '50px', marginTop: '8px' }} />
              )}
            </Box>
            <Box
              sx={{
                backgroundColor: theme.WelcomePage.infoBackgroundColor,
                borderRadius: '12px',
                height: 'auto',
                maxHeight: '80px',
                maxWidth: '200px',
                minWidth: '150px',
                marginRight: '5%',
                padding: '2%',
                marginTop: '-2%',
              }}
            >
              <Typography sx={{ marginLeft: '5%', fontWeight: 'bolder' }}>Asarte</Typography>
              <Typography variant="body2" sx={{ marginLeft: '5%', color: 'grey' }}>
                {t('version')} : 0
              </Typography>
            </Box>
          </Box>
          <Box sx={{ marginTop: '-2%' }}>
            <Typography variant="body2" sx={{ marginLeft: '5%' }}>
              {t('about_jami_text')}
            </Typography>
            <Typography variant="body2" sx={{ marginLeft: '5%', marginTop: '2%' }}>
              {t('about_jami_text_warranty')}
            </Typography>
            <Typography variant="body2" sx={{ marginLeft: '5%', marginTop: '2%' }}>
              © 2015-2025 <Link href="https://savoirfairelinux.com/">Savoir-faire Linux</Link>
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: theme.WelcomePage.infoBackgroundColor,
              borderRadius: '12px',
              marginLeft: '5%',
              marginRight: '5%',
              marginTop: '4%',
              overflowY: 'scroll',
              marginBottom: '5%',
            }}
          >
            <Typography sx={{ fontWeight: 'bolder', marginLeft: '3%', marginTop: '3%', marginBottom: '2%' }}>
              {t('created_by')}
            </Typography>
            {contributorsDevelopers.map((contributor, index) => (
              <Typography variant="body2" key={index} sx={{ marginLeft: '3%' }}>
                {contributor}
              </Typography>
            ))}
            <br />
            <Typography sx={{ fontWeight: 'bolder', marginLeft: '3%', marginTop: '3%', marginBottom: '2%' }}>
              {t('artwork_by')}
            </Typography>
            {contributorsMedia.map((contributor, index) => (
              <Typography variant="body2" key={index} sx={{ marginLeft: '3%' }}>
                {contributor}
              </Typography>
            ))}
            <br />
            <Typography sx={{ fontWeight: 'bolder', marginLeft: '3%', marginTop: '3%' }}>
              {t('about_jami_text_volunteers')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-evenly', marginBottom: '2%' }}>
            <Button
              onClick={() => {
                window.open('https://jami.net/contribute/', '_blank')
              }}
            >
              {t('contribute')}
            </Button>
            <Button
              onClick={() => {
                window.open('mailto:jami@gnu.org')
              }}
            >
              {t('comment')}
            </Button>
          </Box>
        </Box>
      </Modal>
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
              title={<Typography fontWeight={'bolder'}>{title}</Typography>}
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
              title={<Typography fontWeight={'bolder'}>{hiddenTitle}</Typography>}
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
