/*
 * Copyright (C) 2026 Savoir-faire Linux Inc.
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
import { Skeleton, Stack } from '@mui/material'

export interface LoadingSkeletonProps {
  lines?: number
}

export default function LoadingSkeleton({ lines = 4 }: LoadingSkeletonProps) {
  return (
    <Stack role="status" aria-busy="true" aria-label="Loading" spacing={1.5} sx={{ p: 2 }}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} variant="rounded" height={48} />
      ))}
    </Stack>
  )
}
