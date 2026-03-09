"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
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
import { formatTourShowDate } from "./tour-show-row"

interface TourSlotsTableProps {
  slots: SlotShowData[]
  activeColumns: (keyof SlotShowData)[]
  onSongClick: (songName: string) => void
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
}: TourSlotsTableProps) {
  const slotsWithData = slots.filter((slot) => hasRowData(slot, activeColumns))

  const renderSongList = (songs: SongEntryWithId[] | null) => {
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
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onSongClick(song.song)
              }}
              className="text-[11px] font-medium hover:underline cursor-pointer"
            >
              {song.song}
            </a>
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
                      backgroundColor: getColumnBackgroundColor(String(column)),
                      color: "white",
                    }}
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
                  className="bg-background/70 hover:bg-muted/30"
                >
                  <TableCell className="w-[65px] min-w-[65px] py-1 text-center whitespace-nowrap">
                    <Link
                      href={`/dpro/setlist/${slot.show_id}`}
                      className="text-[11px] font-medium hover:underline"
                    >
                      {formatTourShowDate(slot.Show_Date)}
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
                      {renderSongList(slot[column] as SongEntryWithId[] | null)}
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
