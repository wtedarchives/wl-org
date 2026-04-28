"use client"

import { useEffect, useMemo } from "react"
import { notFound, useRouter, useSearchParams } from "next/navigation"

import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import {
  DEFAULT_YEAR_ID,
  YEAR_ID_RE,
} from "@/components/wl-home-v2/wl-home-v2-years-view.constants"
import { YearsArchiveRoutes } from "@/components/wl-home-v2/wl-home-v2-years-page-body"
import { getYearArchiveUrl } from "@/lib/year-archive-url"

export function WlHomeV2YearsView() {
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
  const yearIdParam = rawList[0] ?? ""

  useEffect(() => {
    if (!yearIdParam) {
      router.replace(getYearArchiveUrl(DEFAULT_YEAR_ID))
    }
  }, [yearIdParam, router])

  if (idSet.size > 1) notFound()

  if (!yearIdParam) {
    return <WlHomeV2PageLoading message="Loading years…" />
  }

  if (!YEAR_ID_RE.test(yearIdParam)) notFound()

  return <YearsArchiveRoutes yearId={yearIdParam} />
}
