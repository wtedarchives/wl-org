"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"

import { useAuth } from "@/components/auth-context"
import { parseArchivePrefetchTarget } from "@/lib/archive/parse-archive-prefetch-target"
import { prefetchArchiveTarget } from "@/lib/archive/prefetch-archive-target"

const HOVER_DELAY_MS = 75

export function useArchivePrefetchHandlers() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const profileId = session?.profileId ?? null
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelScheduledPrefetch = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => () => cancelScheduledPrefetch(), [cancelScheduledPrefetch])

  const schedulePrefetchFromHref = useCallback(
    (href: string) => {
      cancelScheduledPrefetch()
      const target = parseArchivePrefetchTarget(href)
      if (!target) return

      timerRef.current = setTimeout(() => {
        timerRef.current = null
        void prefetchArchiveTarget(queryClient, target, profileId)
      }, HOVER_DELAY_MS)
    },
    [cancelScheduledPrefetch, queryClient, profileId],
  )

  return { schedulePrefetchFromHref, cancelScheduledPrefetch }
}
