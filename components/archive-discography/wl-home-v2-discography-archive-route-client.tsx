"use client"

import { useMemo } from "react"
import { notFound, useSearchParams } from "next/navigation"

import { DiscographyReleaseArchiveBody } from "@/components/archive-discography/discography-release-archive-body"
import { WlHomeV2DiscographyArchiveIndexView } from "@/components/archive-discography/wl-home-v2-discography-archive-view"
const RELEASE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function resolveDiscographyIdFromSearchParams(
  searchParams: ReturnType<typeof useSearchParams>,
): { releaseId: string; invalidParams: boolean } {
  const idList = searchParams
    .getAll("id")
    .map((s) => s.trim())
    .filter(Boolean)
  if (new Set(idList).size > 1) {
    return { releaseId: "", invalidParams: true }
  }
  return { releaseId: idList[0] ?? "", invalidParams: false }
}

export function WlHomeV2DiscographyArchiveRouteClient() {
  const searchParams = useSearchParams()
  const { releaseId, invalidParams } = useMemo(
    () => resolveDiscographyIdFromSearchParams(searchParams),
    [searchParams],
  )

  if (invalidParams) notFound()

  if (releaseId) {
    if (!RELEASE_ID_RE.test(releaseId)) notFound()
    return <DiscographyReleaseArchiveBody id={releaseId} wlHomeV2Shell />
  }

  return <WlHomeV2DiscographyArchiveIndexView />
}
