"use client"

import type { ReactNode } from "react"
import { getDiscographyArchiveUrl } from "@/lib/discography-archive-url"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import {
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
} from "@/components/setlist-breadcrumb-context"
import {
  DISCOGRAPHY_V2_MAIN_TILE_STYLE,
  WL_V2_DISCOGRAPHY_PAGE_CLASS,
} from "@/components/archive-discography/discography-release-archive-body.constants"

export function DiscographyReleaseArchiveLoading({
  wlHomeV2Shell,
  releaseId,
  title,
  loadingFallback,
  openArchiveHub,
}: {
  wlHomeV2Shell: boolean
  releaseId: string
  title: string
  loadingFallback?: ReactNode
  openArchiveHub?: () => void
}) {
  if (wlHomeV2Shell) {
    return (
      <div className={WL_V2_DISCOGRAPHY_PAGE_CLASS}>
        <WlHomeV2ArchiveCrumbsShell
          variant="rail"
          bottomSpacing={false}
          trail={
            <WlHomeV2ArchiveCrumbsTrail
              items={[
                WL_V2_ARCHIVES_BREADCRUMB_ROOT,
                { label: "Discography", href: "/archive/discography" },
                { label: "…", href: getDiscographyArchiveUrl(releaseId) },
              ]}
              openArchiveHub={openArchiveHub}
              renderLastCrumb={() => "Loading…"}
            />
          }
        />
        <div
          className="wl-home-v2-years-tile wl-home-v2-years-tile--main discography-release-archive__shell flex min-h-0 min-w-0 w-full flex-1 flex-col"
          style={DISCOGRAPHY_V2_MAIN_TILE_STYLE}
        >
          <div className="discography-release-archive__shell-body wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col">
            {loadingFallback ?
              loadingFallback
            : <WlHomeV2PageLoading
                message={title ? `Loading ${title}…` : "Loading release…"}
              />
            }
          </div>
        </div>
      </div>
    )
  }
  if (loadingFallback) return loadingFallback
  return (
    <LoadingPageCard
      message={title ? `Loading ${title}…` : undefined}
      page="discography"
    />
  )
}
