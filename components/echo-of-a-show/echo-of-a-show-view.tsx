"use client"

import { useMemo } from "react"
import { notFound, useSearchParams } from "next/navigation"

import { EchoOfAShowHome } from "@/components/echo-of-a-show/echo-of-a-show-home"
import { EchoOfAShowSeason } from "@/components/echo-of-a-show/echo-of-a-show-season"
import { EchoOfAShowShowView } from "@/components/echo-of-a-show/echo-of-a-show-show-view"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function resolveEchoParams(searchParams: ReturnType<typeof useSearchParams>): {
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

export function EchoOfAShowView() {
  const searchParams = useSearchParams()
  const { showId, tourId, invalidParams } = useMemo(
    () => resolveEchoParams(searchParams),
    [searchParams],
  )

  if (invalidParams) notFound()

  if (tourId) {
    if (!UUID_RE.test(tourId)) notFound()
    return <EchoOfAShowSeason key={tourId} tourId={tourId} />
  }

  if (showId) {
    if (!UUID_RE.test(showId)) notFound()
    return <EchoOfAShowShowView showId={showId} />
  }

  return <EchoOfAShowHome />
}
