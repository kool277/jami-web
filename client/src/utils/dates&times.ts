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
import dayjs, { Dayjs } from 'dayjs';
import { Duration } from 'dayjs/plugin/duration';
import { i18n } from 'i18next';

export const formatTime = (time: Dayjs, i18n: i18n) => {
  return dayjs(time).locale(i18n.language).format('LT');
};

export const formatRelativeDate = (time: Dayjs, i18n: i18n) => {
  if (time.isToday()) {
    return new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' }).format(0, 'day');
  } else if (time.isYesterday()) {
    return new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' }).format(-1, 'day');
  } else {
    return dayjs(time).locale(i18n.language).format('L');
  }
};

export const formatCallDuration = (duration: Duration) => {
  const minutes = Math.floor(duration.asMinutes()).toString().padStart(2, '0');
  const seconds = duration.format('ss');
  return `${minutes}:${seconds}`;
};
