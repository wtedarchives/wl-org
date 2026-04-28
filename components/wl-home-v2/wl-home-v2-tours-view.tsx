"use client"

import { useEffect, useMemo } from "react"
import { notFound, useRouter, useSearchParams } from "next/navigation"

import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2TourPageBody } from "@/components/wl-home-v2/wl-home-v2-tour-page-body"
import {
  DEFAULT_LANDING_TOUR_NAME,
  TOUR_ID_RE,
} from "@/components/wl-home-v2/wl-home-v2-tours-view.constants"
import { getTourArchiveUrl } from "@/lib/tour-archive-url"
import { supabase } from "@/lib/supabase"

function ToursArchiveRoutes({ tourId }: { tourId: string }) {
  return <WlHomeV2TourPageBody tourId={tourId} />
}

export function WlHomeV2ToursView() {
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
  const tourIdParam = rawList[0] ?? ""

  useEffect(() => {
    if (tourIdParam) return
    let cancelled = false
    ;(async () => {
      if (!supabase) {
        if (!cancelled) router.replace("/archive")
        return
      }
      const { data: tour } = await supabase
        .from("tours")
        .select("tour_id")
        .eq("tour", DEFAULT_LANDING_TOUR_NAME)
        .single()
      if (cancelled) return
      if (tour?.tour_id) {
        router.replace(getTourArchiveUrl(tour.tour_id))
      } else {
        router.replace("/archive")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tourIdParam, router])

  if (idSet.size > 1) notFound()

  if (!tourIdParam) {
    return <WlHomeV2PageLoading message="Loading tour…" />
  }

  if (!TOUR_ID_RE.test(tourIdParam)) notFound()

  return <ToursArchiveRoutes tourId={tourIdParam} />
}
