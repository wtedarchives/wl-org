"use client"

import Image from "next/image"
import Link from "next/link"

import { SongDisplayName } from "@/components/dpro/song-display-name"
import { shouldShowSetlistEntryShort } from "@/components/dpro/setlist/display-setlist-table.constants"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ProgramDirectorCatalogRow } from "@/lib/fetch-program-director-catalog"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import { cn } from "@/lib/utils"

import "./program-director-catalog.css"

/**
 * WL Home v2 setlist-style `.set-table` chrome via scoped CSS in `program-director-catalog.css`;
 * frosted panel wrapper matches tour {@link TourSongsCombined} `widget-panel`.
 */
export function ProgramDirectorCatalogTable({
  rows,
  onRowActivate,
}: {
  rows: ProgramDirectorCatalogRow[]
  onRowActivate: (row: ProgramDirectorCatalogRow) => void
}) {
  if (rows.length === 0) {
    return (
      <p className="px-2 py-8 text-center text-[11px] text-white/55">
        No catalog performances found.
      </p>
    )
  }

  return (
    <Table
      className={cn("set-table wl-home-v2-pd-catalog-set-table")}
    >
      <TableHeader>
        <TableRow>
          <TableHead>Song</TableHead>
          <TableHead className="center">Group</TableHead>
          <TableHead className="center">Date</TableHead>
          <TableHead>Location</TableHead>
          <TableHead className="center">
            <span className="inline-flex items-center justify-center gap-1.5">
              <Image
                src="/WTED2.png"
                alt=""
                width={16}
                height={16}
                className="size-4 shrink-0"
              />
              <span className="sr-only">WTED appearances</span>
            </span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const shortShown = shouldShowSetlistEntryShort(
            row.entrySong,
            row.entryShort,
          )
          const catArt = row.categoryArtwork?.trim() ?? ""
          return (
            <TableRow
              key={row.entryId}
              tabIndex={0}
              className={cn(
                "song-row transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wl-light-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#313a34]",
              )}
              onClick={() => onRowActivate(row)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onRowActivate(row)
                }
              }}
            >
              <TableCell>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  {catArt ?
                    <span className="relative size-5 shrink-0 overflow-hidden rounded border border-white/15">
                      <Image
                        src={catArt}
                        alt=""
                        width={24}
                        height={24}
                        className="size-5 object-cover"
                        unoptimized
                      />
                    </span>
                  : <span
                      className="size-6 shrink-0 rounded border border-white/15 bg-black/25"
                      aria-hidden
                    />
                  }
                  <span className="song-cell-main inline-flex items-center gap-x-2 whitespace-nowrap font-medium">
                    <SongDisplayName
                      song={row.entrySong}
                      songDisplayName={row.songDisplayName}
                    />
                    {shortShown && row.entryShort ?
                      <span className="wl-home-v2-pd-catalog-entry-short shrink-0">
                        {row.entryShort}
                      </span>
                    : null}
                  </span>
                </div>
              </TableCell>
              <TableCell className="center wl-home-v2-pd-catalog-td-muted">
                {row.showGroup ?? null}
              </TableCell>
              <TableCell className="center tabular-nums wl-home-v2-pd-catalog-td-muted">
                {row.showDate ?
                  row.showId ?
                    <Link
                      href={getSetlistArchiveUrl(row.showId)}
                      className="wl-home-v2-pd-catalog-cell-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {formatSetlistDate(row.showDate)}
                    </Link>
                  : formatSetlistDate(row.showDate)
                : null}
              </TableCell>
              <TableCell className="wl-home-v2-pd-catalog-location wl-home-v2-pd-catalog-td-muted">
                {row.venueLocation ?
                  row.venueArchiveKey ?
                    <Link
                      href={getVenueArchiveUrl(row.venueArchiveKey)}
                      className="wl-home-v2-pd-catalog-cell-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.venueLocation}
                    </Link>
                  : row.venueLocation
                : null}
              </TableCell>
              <TableCell className="center tabular-nums font-medium">
                {row.wtedAppearancesCount}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
