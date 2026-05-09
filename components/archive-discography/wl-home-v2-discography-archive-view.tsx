"use client"

import { useMemo } from "react"

import { DiscographyArchiveCategoriesGrid } from "@/components/archive-discography/discography-archive-categories-grid"
import { DISCOGRAPHY_ARCHIVE_BREADCRUMBS } from "@/components/archive-discography/wl-home-v2-discography-archive-view-config"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useDiscographyArchiveIndexData } from "@/hooks/use-discography-archive-index-data"
import { buildDiscographyRowsByCategory } from "@/lib/discography-archive-index"

import "@/components/archive-songs/songs-archive-verbatim.css"

export function WlHomeV2DiscographyArchiveIndexView() {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const { items, loading, error } = useDiscographyArchiveIndexData()

  const byCategory = useMemo(
    () => buildDiscographyRowsByCategory(items),
    [items],
  )

  if (loading) {
    return (
      <div className="songs-archive-verbatim min-w-0 flex-1">
        <WlHomeV2PageLoading message="Loading discography data…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="songs-archive-verbatim min-w-0 flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="widget-panel py-10 text-center">
          <p className="text-sm text-white/65">
            Trouble loading discography. Please reload the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="songs-archive-verbatim wl-home-v2-songs-archive-page box-border flex min-h-0 min-w-0 w-full flex-1 flex-col px-4 py-5 sm:px-5 lg:px-[18px] lg:py-6">
      <WlHomeV2ArchiveCrumbsShell
        variant="page-gutter"
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={DISCOGRAPHY_ARCHIVE_BREADCRUMBS}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DiscographyArchiveCategoriesGrid byCategory={byCategory} />
      </div>
    </div>
  )
}
