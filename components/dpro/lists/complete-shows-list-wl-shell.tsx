"use client"

import type { ReactNode } from "react"

import {
  WlHomeV2ListArchiveShowHeader,
  type WlHomeV2ListArchiveHeaderArtwork,
} from "@/components/dpro/lists/wl-home-v2-list-archive-show-header"

export type CompleteShowsListHeaderArtwork = Extract<
  WlHomeV2ListArchiveHeaderArtwork,
  "category-complete" | "dripfield" | "none"
>

/**
 * WL Home v2 archive layout for “complete shows” lists (category / jive / dripfield)
 * — matches {@link LongestShowsList} / other self-contained list tiles.
 */
export function CompleteShowsListWlShell({
  listName,
  listDescription,
  headerArtwork,
  children,
}: {
  listName: string
  listDescription?: string | null
  headerArtwork: CompleteShowsListHeaderArtwork
  children: ReactNode
}) {
  return (
    <div className="wl-home-v2-setlist flex min-w-0 flex-1 flex-col">
      <section className="wl-home-v2-complete-shows-archive wl-home-v2-years-tile wl-home-v2-years-tile--main flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <WlHomeV2ListArchiveShowHeader
            listName={listName}
            listDescription={listDescription}
            artwork={headerArtwork}
          />
          {children}
        </div>
      </section>
    </div>
  )
}
