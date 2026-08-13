"use client"

import { cn } from "@/lib/utils"

import { BrainsAddArtist } from "./brains-add-artist"
import { BrainsAddPersonnel } from "./brains-add-personnel"
import { BrainsAddSong } from "./brains-add-song"
import { useBrainsWork } from "./brains-work-context"

/**
 * Songs, artists and personnel — the archive-wide lists a setlister may add to.
 *
 * Desktop: three columns (Songs | Artists | Personnel). Mobile: stacked. Each
 * column is search-then-add — brains can insert but not update, so lookup exists
 * to prevent duplicates rather than to edit.
 */
export function BrainsDictionarySection() {
  const { readOnly } = useBrainsWork()

  if (readOnly) return null

  return (
    <div className="widget-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-w-0 flex-col">
      <div
        className={cn(
          "wp-head wl-home-v2-years-shows-wp-head wl-home-v2-tours-shows-wp-head",
          "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center gap-x-3 gap-y-2 border-b border-[rgb(29,32,30)] pb-3",
        )}
      >
        <span className="wp-head-date min-w-0 truncate">Add to the archive</span>
      </div>

      <div className="wl-home-v2-brains-archive-grid">
        <section className="wl-home-v2-brains-archive-col" aria-label="Songs">
          <h3 className="wl-home-v2-brains-archive-col__title">Songs</h3>
          <BrainsAddSong />
        </section>
        <section className="wl-home-v2-brains-archive-col" aria-label="Artists">
          <h3 className="wl-home-v2-brains-archive-col__title">Artists</h3>
          <BrainsAddArtist />
        </section>
        <section
          className="wl-home-v2-brains-archive-col"
          aria-label="Personnel"
        >
          <h3 className="wl-home-v2-brains-archive-col__title">Personnel</h3>
          <BrainsAddPersonnel />
        </section>
      </div>
    </div>
  )
}
