"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { formatEntryLength } from "@/lib/setlist-utils"
import { useLongestPerformancesList } from "@/hooks/use-longest-performances-list"
import { useListContentLoading } from "./list-content-loading-context"

const COVER_SONGS_HEADER_IMAGE =
  "https://i.postimg.cc/1RMm2fpQ/Cover-Songs.jpg"

interface LongestPerformancesListProps {
  listId: string
  isShortest?: boolean
}

function formatShowDate(date: string) {
  if (!date) return ""
  const [year, month, day] = date.split("-")
  if (!year || !month || !day) return date
  return `${month}.${day}.${year.slice(2)}`
}

export function LongestPerformancesList({
  listId,
  isShortest,
}: LongestPerformancesListProps) {
  const { rows, loading, error, progress } = useLongestPerformancesList(!!isShortest)
  const ctx = useListContentLoading()

  useEffect(() => {
    ctx?.setLoading(loading)
  }, [loading, ctx])
  useEffect(() => {
    ctx?.setProgress(progress)
  }, [progress, ctx])

  if (loading) return null

  if (error) {
    return (
      <div className="py-2 px-3 text-center text-sm text-muted-foreground">
        {error}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-2 px-3 text-center text-sm text-muted-foreground">
        No performances found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-max text-xs">
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="px-2 py-0.5 text-left text-xs font-medium">
              Song
            </TableHead>
            <TableHead className="px-2 py-0.5 text-center text-xs font-medium">
              <Image
                src={COVER_SONGS_HEADER_IMAGE}
                alt="Cover Songs"
                width={32}
                height={32}
                className="mx-auto size-8 rounded object-cover border border-border"
                unoptimized
              />
            </TableHead>
            <TableHead className="px-2 py-0.5 text-center text-xs font-medium">
              Length
            </TableHead>
            <TableHead className="px-2 py-0.5 text-left text-xs font-medium">
              Show
            </TableHead>
            <TableHead className="px-2 py-0.5 text-left text-xs font-medium">
              Location
            </TableHead>
            <TableHead className="px-2 py-0.5 text-left text-xs font-medium">
              Coach&apos;s Notes
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow
              key={row.entry_id}
              className={i % 2 === 0 ? "bg-background/70" : "bg-background"}
            >
              <TableCell className="px-2 py-0.5">
                <Link
                  href={getSongArchiveUrl(row.song_id)}
                  className="font-medium hover:underline"
                >
                  <SongDisplayName
                    song={row.entry_song}
                    songDisplayName={row.song_displayname}
                  />
                </Link>
              </TableCell>
              <TableCell className="px-2 py-0.5 text-center align-middle">
                {row.category_artwork ? (
                  <img
                    src={row.category_artwork}
                    alt=""
                    className="mx-auto size-5 rounded object-cover border border-border"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                ) : null}
              </TableCell>
              <TableCell className="px-2 py-0.5 text-center tabular-nums">
                {formatEntryLength(row.entry_length)}
              </TableCell>
              <TableCell className="px-2 py-0.5">
                <Link
                  href={getSetlistArchiveUrl(row.show_id)}
                  className="hover:underline"
                >
                  {formatShowDate(row.show_date)}
                </Link>
              </TableCell>
              <TableCell className="px-2 py-0.5 text-muted-foreground">
                {row.show_venue_location ? (
                  row.venue_id ? (
                    <Link
                      href={`/archive/venue/${row.venue_id}`}
                      className="hover:underline"
                    >
                      {row.show_venue_location}
                    </Link>
                  ) : row.show_subvenue_venue ? (
                    <Link
                      href={`/archive/venue/${encodeURIComponent(row.show_subvenue_venue)}`}
                      className="hover:underline"
                    >
                      {row.show_venue_location}
                    </Link>
                  ) : (
                    row.show_venue_location
                  )
                ) : (
                  ""
                )}
              </TableCell>
              <TableCell className="px-2 py-0.5 text-muted-foreground truncate">
                {row.entry_coachnotes ?? ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
