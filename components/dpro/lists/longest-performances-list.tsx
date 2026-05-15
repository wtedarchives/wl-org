"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

import { LongestPerformancesCoachNotesCell } from "./longest-performances-list-coach-cell"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useLongestPerformancesList } from "@/hooks/use-longest-performances-list"
import { cn } from "@/lib/utils"
import { formatEntryLength } from "@/lib/setlist-utils"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"

import { useListContentLoading } from "./list-content-loading-context"
import { WlHomeV2ListArchiveShowHeader } from "./wl-home-v2-list-archive-show-header"

const COVER_SONGS_HEADER_IMAGE =
  "https://i.postimg.cc/1RMm2fpQ/Cover-Songs.jpg"

function LongestPerfCategoryThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      src={src}
      alt=""
      className="size-5 rounded border border-[rgb(49,51,49)] object-cover"
      onError={() => setFailed(true)}
    />
  )
}

interface LongestPerformancesListProps {
  listId: string
  listName: string
  listDescription: string | null
  isShortest?: boolean
}

function formatShowDate(date: string) {
  if (!date) return ""
  const [year, month, day] = date.split("-")
  if (!year || !month || !day) return date
  return `${month}.${day}.${year.slice(2)}`
}

const headCell = "!px-2 !py-0.5"

export function LongestPerformancesList({
  listName,
  listDescription,
  isShortest,
}: LongestPerformancesListProps) {
  const { rows, loading, error, progress } = useLongestPerformancesList(
    !!isShortest,
  )
  const ctx = useListContentLoading()
  const setListContentLoading = ctx?.setLoading
  const setListContentProgress = ctx?.setProgress

  useEffect(() => {
    setListContentLoading?.(loading)
  }, [loading, setListContentLoading])
  useEffect(() => {
    setListContentProgress?.(progress)
  }, [progress, setListContentProgress])

  if (loading) return null

  const sheetBody = (() => {
    if (error) {
      return (
        <div className="px-3 py-4 text-center text-xs text-white/65">
          {error}
        </div>
      )
    }
    if (rows.length === 0) {
      return (
        <div className="px-3 py-4 text-center text-xs text-white/65">
          No performances found.
        </div>
      )
    }

    return (
      <div className="wl-home-v2-years-table-scroll min-h-0">
        <Table className="wl-home-v2-longest-perf-table wl-home-v2-years-table min-w-max">
          <TableHeader>
            <TableRow className="border-b bg-black/25 hover:bg-black/25">
              <TableHead
                className={cn("text-left text-[10px] font-medium uppercase tracking-wider", headCell)}
              >
                Song
              </TableHead>
              <TableHead
                className={cn(
                  "text-center text-[10px] font-medium uppercase tracking-wider",
                  headCell,
                )}
              >
                <div className="flex justify-center">
                  <Image
                    src={COVER_SONGS_HEADER_IMAGE}
                    alt="Cover Songs"
                    width={32}
                    height={32}
                    className="size-8 rounded border border-[rgb(49,51,49)] object-cover"
                    unoptimized
                  />
                </div>
              </TableHead>
              <TableHead
                className={cn(
                  "text-center text-[10px] font-medium uppercase tracking-wider",
                  headCell,
                )}
              >
                Length
              </TableHead>
              <TableHead
                className={cn(
                  "text-center text-[10px] font-medium uppercase tracking-wider",
                  headCell,
                )}
              >
                Show
              </TableHead>
              <TableHead
                className={cn("text-left text-[10px] font-medium uppercase tracking-wider", headCell)}
              >
                Location
              </TableHead>
              <TableHead
                className={cn(
                  "set-table-coach-notes-head text-left text-[10px] font-medium uppercase tracking-wider",
                  headCell,
                )}
              >
                Coach&apos;s Notes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.entry_id}
                className="border-b bg-transparent transition-colors hover:bg-[rgba(88,200,174,0.11)]"
              >
                <TableCell className={cn("align-middle", headCell)}>
                  <Link
                    href={getSongArchiveUrl(row.song_id)}
                    className="font-medium text-white/[0.92] hover:underline"
                  >
                    <SongDisplayName
                      song={row.entry_song}
                      songDisplayName={row.song_displayname}
                    />
                  </Link>
                </TableCell>
                <TableCell
                  className={cn("text-center align-middle", headCell)}
                >
                  <div className="flex justify-center">
                    {row.category_artwork ?
                      <LongestPerfCategoryThumb src={row.category_artwork} />
                    : null}
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-center align-middle tabular-nums text-white/85",
                    headCell,
                  )}
                >
                  {formatEntryLength(row.entry_length)}
                </TableCell>
                <TableCell
                  className={cn("text-center align-middle", headCell)}
                >
                  <Link
                    href={getSetlistArchiveUrl(row.show_id)}
                    className="hover:underline"
                  >
                    {formatShowDate(row.show_date)}
                  </Link>
                </TableCell>
                <TableCell className={cn("align-middle text-white/70", headCell)}>
                  {row.show_venue_location ?
                    row.venue_id ?
                      <Link
                        href={getVenueArchiveUrl(row.venue_id)}
                        className="hover:underline"
                      >
                        {row.show_venue_location}
                      </Link>
                    : row.show_subvenue_venue ?
                      <Link
                        href={getVenueArchiveUrl(row.show_subvenue_venue)}
                        className="hover:underline"
                      >
                        {row.show_venue_location}
                      </Link>
                    : row.show_venue_location
                  : ""}
                </TableCell>
                <LongestPerformancesCoachNotesCell
                  entryId={row.entry_id}
                  coachNotes={row.entry_coachnotes}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  })()

  return (
    <div className="wl-home-v2-setlist flex min-w-0 flex-1 flex-col">
      <section className="wl-home-v2-longest-perf-list wl-home-v2-years-tile wl-home-v2-years-tile--main flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <WlHomeV2ListArchiveShowHeader
            listName={listName}
            listDescription={listDescription}
            artwork="none"
          />

          <div className="widget-panel wl-home-v2-longest-perf-table-panel wl-home-v2-years-shows-panel wl-home-v2-years-shows-panel--natural flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {sheetBody}
          </div>
        </div>
      </section>
    </div>
  )
}
