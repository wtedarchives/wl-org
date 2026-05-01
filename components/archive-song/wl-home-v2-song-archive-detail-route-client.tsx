"use client"

import { useEffect, useMemo } from "react"
import { notFound, useRouter, useSearchParams } from "next/navigation"

import { WlHomeV2SongArchiveDetailView } from "@/components/archive-song/wl-home-v2-song-archive-detail-view"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

const SONG_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function WlHomeV2SongArchiveDetailRouteClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawList = useMemo(
    () =>
      searchParams
        .getAll("id")
        .map((s) => s.trim())
        .filter(Boolean),
    [searchParams],
  )
  const idSet = new Set(rawList)
  const songIdParam = rawList[0] ?? ""

  useEffect(() => {
    if (songIdParam) return
    router.replace("/archive/songs")
  }, [songIdParam, router])

  if (idSet.size > 1) {
    notFound()
  }

  if (!songIdParam) {
    return <WlHomeV2PageLoading message="Opening songs…" />
  }

  if (!SONG_ID_RE.test(songIdParam)) {
    notFound()
  }

  return <WlHomeV2SongArchiveDetailView songId={songIdParam} />
}
