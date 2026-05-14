"use client"

import type { CSSProperties } from "react"

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
import type { SlotShowData, SongEntryWithId } from "@/types/tour"
import { getColumnBackgroundColor } from "@/lib/stats/tour-utils"
import { formatTourShowDate } from "./tour-show-format"
import { cn } from "@/lib/utils"

import "./tour-slots-table.css"

interface TourSlotsTableProps {
  slots: SlotShowData[]
  activeColumns: (keyof SlotShowData)[]
  onSongClick: (songName: string, songDisplayName?: string | null) => void
  wlHomeV2?: boolean
}

function formatColumnLabel(column: string): string {
  return column
    .split("_")
    .map((word) =>
      word === "Op" ? "Opener" : word === "Cl" ? "Closer" : word
    )
    .join(" ")
}

function hasRowData(slot: SlotShowData, activeColumns: (keyof SlotShowData)[]): boolean {
  return activeColumns.some((col) => {
    const val = slot[col] as SongEntryWithId[] | null
    return val != null && val.length > 0
  })
}

export function TourSlotsTable({
  slots,
  activeColumns,
  onSongClick,
  wlHomeV2 = false,
}: TourSlotsTableProps) {
  const slotsWithData = slots.filter((slot) => hasRowData(slot, activeColumns))

  const renderSongList = (songs: SongEntryWithId[] | null) => {
    if (!songs || songs.length === 0) return null
    return (
      <div className="w-full min-w-0 whitespace-normal text-left text-[11px] leading-3 break-words">
        {songs.flatMap((song, index) => {
          const link = (
            <a
              key={`${song.song}-${index}-link`}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onSongClick(song.song, song.song_displayname)
              }}
              className="cursor-pointer break-words hover:underline"
            >
              <SongDisplayName
                song={song.song}
                songDisplayName={song.song_displayname}
                underlineOnHover={false}
                compactInline
              />
            </a>
          )
          if (index === 0) return [link]
          return [
            <span
              key={`${song.song}-${index}-sep`}
              aria-hidden
              className="text-destructive"
            >
              {" → "}
            </span>,
            link,
          ]
        })}
      </div>
    )
  }

  const tableInner = (
    <div className="overflow-x-auto">
      <Table
        className={cn(
          "table-fixed min-w-max text-[11px]",
          wlHomeV2 && "wl-home-v2-years-table",
        )}
      >
        <TableHeader>
          <TableRow
            className={cn(
              wlHomeV2 ?
                "border-b bg-black/25 hover:bg-black/25"
              : "bg-muted/60",
            )}
          >
            <TableHead
              className={cn(
                "w-[65px] min-w-[65px] text-center text-[11px] font-medium",
                wlHomeV2 ? "!py-0.5" : "py-1",
              )}
            >
              Date
            </TableHead>
            {activeColumns.map((column) => (
              <TableHead
                key={column}
                className={cn(
                  "wl-tour-slots-table__slot-head text-left text-[11px] font-medium",
                  wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1",
                )}
                style={
                  {
                    "--wl-tour-slots-col-bg":
                      getColumnBackgroundColor(String(column)) || "transparent",
                  } as CSSProperties
                }
              >
                {formatColumnLabel(String(column))}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {slotsWithData.map((slot) => (
            <TableRow
              key={slot.show_id}
              className={cn(
                wlHomeV2 ?
                  "border-b bg-transparent transition-colors hover:bg-[rgba(88,200,174,0.11)]"
                : "bg-background/70 hover:bg-muted/30",
              )}
            >
                  <TableCell
                    className={cn(
                      "w-[65px] min-w-[65px] text-center whitespace-nowrap text-[11px] font-medium tabular-nums",
                      wlHomeV2 ? "!px-2 !py-0.5" : "py-1",
                    )}
                  >
                    <Link
                      href={getSetlistArchiveUrl(slot.show_id)}
                      className="hover:underline"
                    >
                      {formatTourShowDate(slot.Show_Date)}
                    </Link>
                  </TableCell>
                  {activeColumns.map((column) => (
                    <TableCell
                      key={`${slot.show_id}-${column}`}
                      className={cn(
                        "wl-tour-slots-table__slot-cell text-left align-middle whitespace-normal break-words overflow-hidden text-[11px]",
                        wlHomeV2 ? "!px-2 !py-0.5" : "px-2 py-1",
                      )}
                    >
                      {renderSongList(slot[column] as SongEntryWithId[] | null)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
  )

  if (wlHomeV2) {
    return (
      <div className="widget-panel shrink-0">
        <div className="wp-head wl-home-v2-years-shows-wp-head">
          <span>Slots</span>
        </div>
        {tableInner}
      </div>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 py-0">
      <div className="border-b border-border/60 bg-muted/60 px-3 py-2">
        <h2 className="text-sm font-semibold">Slots</h2>
      </div>
      <CardContent className="p-0">{tableInner}</CardContent>
    </Card>
  )
}
