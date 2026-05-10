"use client"

import { ListsArchiveIndexTiles } from "@/components/archive-lists/lists-archive-index-tiles"
import { LISTS_ARCHIVE_BREADCRUMBS } from "@/components/archive-lists/wl-home-v2-lists-archive-view-config"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"
import { useListsData } from "@/hooks/use-lists-data"

import "@/components/archive-songs/songs-archive-verbatim.css"

export function WlHomeV2ListsArchiveIndexView() {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()
  const { songLists, showLists, loading, error } = useListsData()

  if (loading) {
    return (
      <div className="songs-archive-verbatim min-w-0 flex-1">
        <WlHomeV2PageLoading message="Loading lists data…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="songs-archive-verbatim min-w-0 flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="widget-panel py-10 text-center">
          <p className="text-sm text-white/65">
            Trouble loading lists. Please reload the page.
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
            items={LISTS_ARCHIVE_BREADCRUMBS}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
      />

      <ListsArchiveIndexTiles songLists={songLists} showLists={showLists} />
    </div>
  )
}
