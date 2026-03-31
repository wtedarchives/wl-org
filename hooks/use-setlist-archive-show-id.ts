"use client"

import { useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { resolveSetlistShowIdFromSearchParams } from "@/lib/setlist-archive-resolve-show-id"

export function useSetlistArchiveShowId() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showId, invalidParams } = useMemo(
    () => resolveSetlistShowIdFromSearchParams(searchParams),
    [searchParams],
  )

  useEffect(() => {
    if (invalidParams || !showId) return
    const hasIdParam = searchParams
      .getAll("id")
      .map((s) => s.trim())
      .some(Boolean)
    const legacy = searchParams.get("show_id")?.trim() ?? ""
    if (hasIdParam || !legacy) return
    router.replace(getSetlistArchiveUrl(legacy), { scroll: false })
  }, [invalidParams, showId, searchParams, router])

  return { showId, invalidParams }
}
