"use client"

import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

export function useWtedEpisodePageId() {
  const searchParams = useSearchParams()
  return useMemo(() => {
    const raw = searchParams.get("id")
    const episodeId = raw?.trim() ?? ""
    const invalidParams =
      searchParams.getAll("id").filter((s) => s.trim().length > 0).length > 1
    return {
      episodeId: episodeId.length > 0 ? episodeId : undefined,
      invalidParams,
    }
  }, [searchParams])
}
