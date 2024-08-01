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
import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { HttpStatusCode } from 'jami-web-common'
import { getLinkPreview } from 'link-preview-js'
import * as linkify from 'linkifyjs'

import { authenticateToken } from '../middleware/auth.js'

export const linkPreviewRouter = Router()

// Result of getLinkPreview from link-preview-js
type LinkPreviewJs = {
  url: string
  title: string
  siteName: string | undefined
  description: string | undefined
  mediaType: string
  contentType: string | undefined
  images: string[]
  videos: {
    url: string | undefined
    secureUrl: string | null | undefined
    type: string | null | undefined
    width: string | undefined
    height: string | undefined
  }[]
  favicons: string[]
}

linkPreviewRouter.use(authenticateToken)

const linkPreviewOptions = {
  // Allowing redirection from http to https
  // Code from doc: https://github.com/ospfranco/link-preview-js#redirections
  followRedirects: 'manual',
  handleRedirects: (baseURL: string, forwardedURL: string) => {
    const urlObj = new URL(baseURL)
    const forwardedURLObj = new URL(forwardedURL)
    if (
      forwardedURLObj.hostname === urlObj.hostname ||
      forwardedURLObj.hostname === 'www.' + urlObj.hostname ||
      'www.' + forwardedURLObj.hostname === urlObj.hostname
    ) {
      return true
    } else {
      return false
    }
  },
} as const

linkPreviewRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const url = req.query.url

    if (typeof url !== 'string') {
      res.status(HttpStatusCode.BadRequest).send('Invalid query parameters')
      return
    }

    // Add 'http' or 'https' if absent. This is required by getLinkPreview
    const sanitizedUrl = linkify.find(url)[0]?.href

    if (!sanitizedUrl) {
      res.status(HttpStatusCode.BadRequest).send('Invalid url')
      return
    }

    try {
      const detailedLinkPreview = (await getLinkPreview(sanitizedUrl, linkPreviewOptions)) as LinkPreviewJs
      const linkPreview = {
        title: detailedLinkPreview.title,
        description: detailedLinkPreview.description,
        // We might eventualy want to compare the images in order to select the best fit
        // https://andrejgajdos.com/how-to-create-a-link-preview/
        image: detailedLinkPreview.images[0] ?? detailedLinkPreview.favicons[0],
      }
      res.json(linkPreview).end()
    } catch (e) {
      res.status(HttpStatusCode.NotFound).send('Could not access url')
    }
  })
)
