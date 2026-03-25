"use client"


import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getColumnBackgroundColor } from "@/lib/stats/tour-utils"
import type { UserSlotShowData, UserSongEntryWithId } from "@/types/user-slots"

function formatColumnLabel(column: string): string {
  return column
    .split("_")
    .map((word) =>
      word === "Op" ? "Opener" : word === "Cl" ? "Closer" : word
    )
    .join(" ")
}

function formatShowDate(showDate: string): string {
  const [year, month, day] = showDate.split("-")
  return `${month}.${day}.${year.slice(2)}`
}

function hasRowData(
  slot: UserSlotShowData,
  activeColumns: string[]
): boolean {
  return activeColumns.some((col) => {
    const val = slot[col] as UserSongEntryWithId[] | null
    return val != null && val.length > 0
  })
}

export interface UserSlotsTableProps {
  slots: UserSlotShowData[]
  activeColumns: string[]
  onSongClick: (songName: string, songDisplayName?: string | null) => void
}

export function UserSlotsTable({
  slots,
  activeColumns,
  onSongClick,
}: UserSlotsTableProps) {
  const slotsWithData = slots.filter((slot) =>
    hasRowData(slot, activeColumns)
  )

  const renderSongList = (songs: UserSongEntryWithId[] | null) => {
    if (!songs || songs.length === 0) return null
    return (
      <div
        className="w-full min-w-0 text-left leading-3"
        style={{
          wordWrap: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {songs.map((song, index) => (
          <span key={`${song.song}-${index}`}>
            {index > 0 && (
              <span className="text-destructive mr-1">→</span>
            )}
            <button
              type="button"
              onClick={() =>
                onSongClick(song.song, song.song_displayname)
              }
              className="text-[11px] font-medium hover:underline cursor-pointer text-left"
            >
              <SongDisplayName
                song={song.song}
                songDisplayName={song.song_displayname}
              />
            </button>
            {index < songs.length - 1 && <span className="mr-1" />}
          </span>
        ))}
      </div>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <div className="border-b border-border/60 bg-muted/60 px-3 py-2">
        <h2 className="text-sm font-semibold">Slots</h2>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table
            className="min-w-max text-[11px]"
            style={{ tableLayout: "fixed" }}
          >
            <TableHeader>
              <TableRow className="bg-muted/60">
                <TableHead className="w-[65px] min-w-[65px] py-1 text-center text-[11px] font-medium">
                  Date
                </TableHead>
                {activeColumns.map((column) => (
                  <TableHead
                    key={column}
                    className="px-2 py-1 text-left text-[11px] font-medium"
                    style={{
                      width: "190px",
                      minWidth: "190px",
                      backgroundColor: getColumnBackgroundColor(column),
                      color: "white",
                    }}
                  >
                    {formatColumnLabel(column)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {slotsWithData.map((slot) => (
                <TableRow
                  key={slot.show_id}
                  className="bg-background/70 hover:bg-muted/30"
                >
                  <TableCell className="w-[65px] min-w-[65px] py-1 text-center whitespace-nowrap">
                    <Link
                      href={getSetlistArchiveUrl(slot.show_id)}
                      className="text-[11px] font-medium hover:underline"
                    >
                      {formatShowDate(slot.Show_Date)}
                    </Link>
                  </TableCell>
                  {activeColumns.map((column) => (
                    <TableCell
                      key={`${slot.show_id}-${column}`}
                      className="px-2 py-1 text-left align-middle whitespace-normal break-words overflow-hidden"
                      style={{
                        width: "190px",
                        minWidth: "190px",
                        maxWidth: "190px",
                      }}
                    >
                      {renderSongList(
                        slot[column] as UserSongEntryWithId[] | null
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
