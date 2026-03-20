"use client"

import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { getMatrixPlacementColor } from "@/lib/stats/tour-utils"
import type { UserSongMatrixData, YearGroup } from "@/hooks/use-user-song-matrix"

function formatShowDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z")
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${m}.${day}`
}

export interface UserSongMatrixProps {
  songMatrix: UserSongMatrixData
  sortedSongs: string[]
  yearGroups: YearGroup[]
  yearIdMap: Record<string, string>
  songIdMap: Record<string, string>
  shows: Array<{ show_id: string; show_date: string }>
}

export function UserSongMatrix({
  songMatrix,
  sortedSongs,
  yearGroups,
  yearIdMap,
  songIdMap,
  shows,
}: UserSongMatrixProps) {
  return (
    <div className="overflow-x-auto overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-muted/50">
            <TableHead
              rowSpan={2}
              className="pl-3 py-1.5 text-left text-xs font-medium bg-muted/50 border-b border-r border-border align-bottom"
            >
              Song
            </TableHead>
            {yearGroups.map((group) => (
              <TableHead
                key={group.year}
                colSpan={group.shows.length}
                className="h-auto px-1 py-1 text-center text-xs font-semibold bg-muted/50 border-b border-r border-border last:border-r-0"
              >
                {yearIdMap[group.year] ? (
                  <Link
                    href={`/archive/years/${yearIdMap[group.year]}`}
                    className="hover:underline"
                  >
                    {group.year}
                  </Link>
                ) : (
                  <span>{group.year}</span>
                )}
              </TableHead>
            ))}
          </TableRow>
          <TableRow className="border-border bg-muted/50">
            {shows.map((show) => (
              <TableHead
                key={show.show_id}
                className="h-auto px-1 py-1 text-center text-xs font-medium whitespace-nowrap min-w-[3rem] border-r border-border last:border-r-0"
              >
                <Link
                  href={`/archive/setlist/${show.show_id}`}
                  className="hover:underline"
                >
                  {formatShowDate(show.show_date)}
                </Link>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSongs.map((song) => {
            const performances = songMatrix.data[song] ?? []
            return (
              <TableRow
                key={song}
                className="border-border bg-background/70 hover:bg-muted/40"
              >
                <TableCell className="font-medium text-xs pl-3 py-0.5 whitespace-nowrap border-r border-border">
                  {songIdMap[song] ? (
                    <Link
                      href={`/archive/song/${songIdMap[song]}`}
                      className="hover:underline"
                    >
                      <SongDisplayName
                        song={song}
                        songDisplayName={songMatrix.songDisplayNameMap?.[song]}
                      />
                    </Link>
                  ) : (
                    <SongDisplayName
                      song={song}
                      songDisplayName={songMatrix.songDisplayNameMap?.[song]}
                    />
                  )}
                </TableCell>
                {shows.map((show) => {
                  const perf = performances.find(
                    (p) => p.showId === show.show_id
                  )
                  const base = getMatrixPlacementColor(perf?.placement ?? null)
                  const bg =
                    perf?.placement?.startsWith("Main Set") ? "#333333" : base
                  return (
                    <TableCell
                      key={`${song}-${show.show_id}`}
                      className="text-center border-r border-border p-0 last:border-r-0"
                      style={{
                        backgroundColor: bg || undefined,
                        minWidth: "3rem",
                      }}
                    >
                      {perf && (
                        <span className="text-white text-xs font-medium inline-block py-0.5">
                          {perf.venueAppearanceCount}
                        </span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
