"use client"

import { useEffect, useMemo } from "react"
import { notFound, useRouter, useSearchParams } from "next/navigation"

import { WlHomeV2VenueArchiveDetailView } from "@/components/archive-venue/wl-home-v2-venue-archive-detail-view"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

export function WlHomeV2VenueArchiveDetailRouteClient() {
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
  const venueKeyParam = rawList[0] ?? ""

  useEffect(() => {
    if (venueKeyParam) return
    router.replace("/archive/venues")
  }, [venueKeyParam, router])

  if (idSet.size > 1) {
    notFound()
  }

  if (!venueKeyParam) {
    return <WlHomeV2PageLoading message="Opening venues…" />
  }

  return <WlHomeV2VenueArchiveDetailView venueKey={venueKeyParam} />
}
