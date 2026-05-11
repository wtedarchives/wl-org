"use client"

import { useMemo } from "react"
import { notFound, useSearchParams } from "next/navigation"

import { SetlistGameContent } from "@/components/dpro/setlistgame/setlist-game-content"
import { SetlistGameShowView } from "@/components/dpro/setlistgame/setlist-game-show-view"
import { SetlistGameTourView } from "@/components/dpro/setlistgame/setlist-game-tour-view"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function resolveSetlistGameParams(
  searchParams: ReturnType<typeof useSearchParams>,
): {
  showId: string
  tourId: string
  invalidParams: boolean
} {
  const ids = searchParams
    .getAll("id")
    .map((s) => s.trim())
    .filter(Boolean)
  const tourIds = searchParams
    .getAll("tour_id")
    .map((s) => s.trim())
    .filter(Boolean)
  if (new Set(ids).size > 1 || new Set(tourIds).size > 1) {
    return { showId: "", tourId: "", invalidParams: true }
  }
  const showId = ids[0] ?? ""
  const tourId = tourIds[0] ?? ""
  if (showId && tourId) {
    return { showId: "", tourId: "", invalidParams: true }
  }
  return { showId, tourId, invalidParams: false }
}

export function WlHomeV2SetlistGameView() {
  const searchParams = useSearchParams()
  const { showId, tourId, invalidParams } = useMemo(
    () => resolveSetlistGameParams(searchParams),
    [searchParams],
  )

  if (invalidParams) notFound()

  if (tourId) {
    if (!UUID_RE.test(tourId)) notFound()
    return <SetlistGameTourView tourId={tourId} variant="wlHomeV2" />
  }

  if (showId) {
    if (!UUID_RE.test(showId)) notFound()
    return <SetlistGameShowView showId={showId} variant="wlHomeV2" />
  }

  return <SetlistGameContent variant="wlHomeV2" />
}
