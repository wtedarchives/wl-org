"use client"

import Link from "next/link"
import Image from "next/image"
import { Loader2, X } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useJotyData } from "@/hooks/use-joty-data"
import { getJotyBadgeStyle } from "@/components/dpro/setlist/display-setlist-table.constants"
import { cn } from "@/lib/utils"
import type { JotyRoundWithResults, JotyResultRow } from "@/hooks/use-joty-data"

function formatShowDate(dateStr: string | null): string {
  if (!dateStr || typeof dateStr !== "string") return "—"
  const dateOnly = dateStr.includes("T") ? dateStr.slice(0, dateStr.indexOf("T")) : dateStr.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return "—"
  const d = new Date(dateOnly + "T00:00:00.000Z")
  if (Number.isNaN(d.getTime())) return "—"
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  const y = String(d.getUTCFullYear()).slice(-2)
  return `${m}.${day}.${y}`
}

interface SetlistJotyDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number | null
  highlightedEntryId: string | null
}

const JOTY_DESCRIPTION =
  "Jam of the Year is an annual bracket-style ranking initiative presented by Always Almost There and powered by nugs."

export function SetlistJotyDrawer({
  open,
  onOpenChange,
  year,
  highlightedEntryId,
}: SetlistJotyDrawerProps) {
  const { rounds, loading } = useJotyData(open, year)
  const displayYear = year ?? 0

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] max-w-[800px] mx-auto flex flex-col rounded-t-xl w-full outline-none focus:outline-none focus-visible:outline-none [&:focus]:outline-none [&:focus-visible]:outline-none ring-0 focus:ring-0">
        <DrawerHeader className="flex flex-row items-center justify-between gap-4 border-b border-border pb-3 shrink-0 pt-0">
          <div className="flex w-16 shrink-0 items-center justify-start gap-1.5">
            <a
              href="https://jotyoftheyear.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 opacity-90 hover:opacity-100 transition-opacity"
              aria-label="Always Almost There – jotyoftheyear.com"
            >
              <Image
                src="/AAT.jpg"
                alt="Always Almost There"
                width={80}
                height={32}
                className="h-6 w-auto object-contain rounded-full"
                unoptimized
              />
            </a>
            <a
              href="https://nugs.net"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 opacity-90 hover:opacity-100 transition-opacity"
              aria-label="nugs.net"
            >
              <Image
                src="/NugsColor.png"
                alt="nugs"
                width={32}
                height={32}
                className="h-6 w-auto object-contain rounded-full"
                unoptimized
              />
            </a>
          </div>
          <div className="min-w-0 flex-1 flex flex-col items-center justify-center text-center">
            <DrawerTitle className="text-base font-semibold">
              Jam of the Year {displayYear}
            </DrawerTitle>
          </div>
          <div className="flex w-16 shrink-0 items-center justify-end">
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="shrink-0 rounded-full size-8">
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading JOTY data…
              </p>
            </div>
          )}
          {!loading && year != null && rounds.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No JOTY data found for {year}.
            </p>
          )}
          {!loading && rounds.length > 0 && (
            <div className="space-y-3">
              {rounds.map((round) => (
                <RoundBlock
                  key={round.round_abbr}
                  round={round}
                  highlightedEntryId={highlightedEntryId}
                />
              ))}
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-border shrink-0 py-2 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {JOTY_DESCRIPTION}
          </p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function RoundBlock({
  round,
  highlightedEntryId,
}: {
  round: JotyRoundWithResults
  highlightedEntryId: string | null
}) {
  const badgeStyle = getJotyBadgeStyle(round.round_abbr)
  return (
    <section className="border border-border p-1 rounded-lg bg-muted/30">
      <div className="flex items-center gap-4 ml-1.5 mb-2">
        <span className="text-sm font-medium text-foreground">
          {round.round_name}
        </span>
        <span
          className={badgeStyle.className}
          style={badgeStyle.style}
        >
          {round.round_abbr}
        </span>
      </div>
      <Table>
        <TableBody>
          {round.results.map((row) => (
            <ResultRow
              key={row.entry_id}
              row={row}
              isHighlighted={row.entry_id === highlightedEntryId}
            />
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

function ResultRow({
  row,
  isHighlighted,
}: {
  row: JotyResultRow
  isHighlighted: boolean
}) {
  const songLabel = [
    row.entry_song
  ]
    .filter(Boolean)
    .join(" ")
  const venueDisplay = row.show_venue_location
    ? row.show_subvenue?.trim()
      ? `${row.show_venue_location}`
      : row.show_venue_location
    : "—"

  return (
    <TableRow
      className={cn(
        "border-border/60 transition-colors",
        isHighlighted ? "bg-primary/20" : "hover:bg-muted/50"
      )}
    >
      <TableCell className="text-xs font-medium py-0.5">
        {row.song_id ? (
          <Link
            href={`/dpro/song/${row.song_id}`}
            className="text-foreground hover:underline"
          >
            {songLabel}
          </Link>
        ) : (
          <span>{songLabel}</span>
        )}
      </TableCell>
      <TableCell className="text-xs py-0.5 text-muted-foreground">
        {row.show_id ? (
          <Link
            href={`/dpro/setlist/${row.show_id}`}
            className="hover:underline text-foreground"
          >
            {formatShowDate(row.show_date)}
          </Link>
        ) : (
          formatShowDate(row.show_date)
        )}
      </TableCell>
      <TableCell className="text-xs py-0.5 text-muted-foreground">
        {venueDisplay}
      </TableCell>
    </TableRow>
  )
}
