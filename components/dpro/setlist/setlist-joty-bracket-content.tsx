"use client"

import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { getJotyBadgeStyle } from "@/components/dpro/setlist/display-setlist-table.constants"
import { useJotyData } from "@/hooks/use-joty-data"
import type { JotyResultRow, JotyRoundWithResults } from "@/hooks/use-joty-data"
import { cn } from "@/lib/utils"

export const JOTY_DESCRIPTION =
  "Jam of the Year is an annual bracket-style ranking initiative presented by Always Almost There and powered by nugs."

function formatShowDate(dateStr: string | null): string {
  if (!dateStr || typeof dateStr !== "string") return "—"
  const dateOnly =
    dateStr.includes("T") ? dateStr.slice(0, dateStr.indexOf("T")) : dateStr.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return "—"
  const d = new Date(dateOnly + "T00:00:00.000Z")
  if (Number.isNaN(d.getTime())) return "—"
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  const y = String(d.getUTCFullYear()).slice(-2)
  return `${m}.${day}.${y}`
}

/** AAT + nugs marks — used by {@link SetlistJotyDrawer} and WL Home v2 JOTY modal. */
export function JotyBracketSponsorLogos() {
  return (
    <div className="flex shrink-0 items-center justify-start gap-1.5">
      <a
        href="https://jotyoftheyear.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 opacity-90 transition-opacity hover:opacity-100"
        aria-label="Always Almost There – jotyoftheyear.com"
      >
        <Image
          src="/AAT.jpg"
          alt="Always Almost There"
          width={80}
          height={32}
          className="h-6 w-auto rounded-full object-contain"
          unoptimized
        />
      </a>
      <a
        href="https://nugs.net"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 opacity-90 transition-opacity hover:opacity-100"
        aria-label="nugs.net"
      >
        <Image
          src="/NugsColor.png"
          alt="nugs"
          width={32}
          height={32}
          className="h-6 w-auto rounded-full object-contain"
          unoptimized
        />
      </a>
    </div>
  )
}

type SetlistJotyBracketDataBodyProps = {
  open: boolean
  year: number | null
  highlightedEntryId: string | null
  onNavigate: () => void
}

/**
 * Scrollable JOTY rounds table (and loading / empty) — shared by the setlist archive drawer
 * and the WL Home v2 JOTY modal. Parent must mount only when the shell is open.
 */
export function SetlistJotyBracketDataBody({
  open,
  year,
  highlightedEntryId,
  onNavigate,
}: SetlistJotyBracketDataBodyProps) {
  const { rounds, loading } = useJotyData(open, year)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading JOTY data…</p>
      </div>
    )
  }

  if (year != null && rounds.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No JOTY data found for {year}.
      </p>
    )
  }

  if (rounds.length > 0) {
    return (
      <div className="space-y-3">
        {rounds.map((round) => (
          <RoundBlock
            key={round.round_abbr}
            round={round}
            highlightedEntryId={highlightedEntryId}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    )
  }

  return null
}

function RoundBlock({
  round,
  highlightedEntryId,
  onNavigate,
}: {
  round: JotyRoundWithResults
  highlightedEntryId: string | null
  onNavigate: () => void
}) {
  const badgeStyle = getJotyBadgeStyle(round.round_abbr)
  return (
    <section className="rounded-lg border border-border bg-muted/30 p-1">
      <div className="mb-2 ml-1.5 flex items-center gap-4">
        <span className="text-sm font-medium text-foreground">
          {round.round_name}
        </span>
        <span className={badgeStyle.className} style={badgeStyle.style}>
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
              onNavigate={onNavigate}
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
  onNavigate,
}: {
  row: JotyResultRow
  isHighlighted: boolean
  onNavigate: () => void
}) {
  const venueDisplay = row.show_venue_location
    ? row.show_subvenue?.trim()
      ? `${row.show_venue_location}`
      : row.show_venue_location
    : "—"

  return (
    <TableRow
      className={cn(
        "border-border/60 transition-colors",
        isHighlighted ? "bg-primary/20" : "hover:bg-muted/50",
      )}
    >
      <TableCell className="py-0.5 text-xs font-medium">
        {row.song_id ?
          <Link
            href={getSongArchiveUrl(row.song_id)}
            className="text-foreground hover:underline"
            onClick={onNavigate}
          >
            <SongDisplayName
              song={row.song}
              songDisplayName={row.song_displayname}
            />
          </Link>
        : <SongDisplayName
            song={row.song}
            songDisplayName={row.song_displayname}
          />
        }
      </TableCell>
      <TableCell className="py-0.5 text-xs text-muted-foreground">
        {row.show_id ?
          <Link
            href={getSetlistArchiveUrl(row.show_id)}
            className="text-foreground hover:underline"
            onClick={onNavigate}
          >
            {formatShowDate(row.show_date)}
          </Link>
        : formatShowDate(row.show_date)}
      </TableCell>
      <TableCell className="py-0.5 text-xs text-muted-foreground">
        {venueDisplay}
      </TableCell>
    </TableRow>
  )
}
