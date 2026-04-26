"use client"

import { Fragment } from "react"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import Link from "next/link"
import Image from "next/image"
import { CircleNotch } from "@phosphor-icons/react"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import {
  getJotyBadgeStyle,
  getJotyPillWlV2Style,
} from "@/components/dpro/setlist/display-setlist-table.constants"
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
export function JotyBracketSponsorLogos({ className }: { className?: string }) {
  const linkClass =
    "inline-flex shrink-0 origin-center opacity-90 transition-all duration-200 ease-out hover:scale-110 hover:opacity-100 active:scale-100"
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-start gap-1.5",
        className,
      )}
    >
      <a
        href="https://jotyoftheyear.com"
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
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
        className={linkClass}
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
  /** WL Home v2: match {@link YearShowsTable} `wlHomeV2` table chrome (11px, row hovers). */
  wlHomeV2YearsTable?: boolean
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
  wlHomeV2YearsTable = false,
}: SetlistJotyBracketDataBodyProps) {
  const { rounds, loading } = useJotyData(open, year)
  const y = wlHomeV2YearsTable

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <CircleNotch
          className={cn(
            "size-6 animate-spin",
            y ? "text-white/55" : "text-muted-foreground",
          )}
          aria-hidden
        />
        <p
          className={cn(
            "text-sm",
            y ? "text-white/55" : "text-muted-foreground",
          )}
        >
          Loading JOTY data…
        </p>
      </div>
    )
  }

  if (year != null && rounds.length === 0) {
    return (
      <p
        className={cn(
          "py-6 text-center text-sm",
          y ? "text-white/55" : "text-muted-foreground",
        )}
      >
        No JOTY data found for {year}.
      </p>
    )
  }

  if (rounds.length > 0) {
    return (
      <Table
        className={cn(
          y && "wl-home-v2-years-table min-w-max text-[11px]",
        )}
      >
        <TableBody>
          {rounds.map((round, roundIndex) => (
            <Fragment key={round.round_abbr}>
              <RoundSectionHeaderRow
                round={round}
                showTopBorder={roundIndex > 0}
                wlHomeV2YearsTable={y}
              />
              {round.results.map((row) => (
                <ResultRow
                  key={row.entry_id}
                  row={row}
                  isHighlighted={row.entry_id === highlightedEntryId}
                  onNavigate={onNavigate}
                  wlHomeV2YearsTable={y}
                />
              ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    )
  }

  return null
}

function RoundSectionHeaderRow({
  round,
  showTopBorder,
  wlHomeV2YearsTable,
}: {
  round: JotyRoundWithResults
  showTopBorder: boolean
  wlHomeV2YearsTable: boolean
}) {
  const y = wlHomeV2YearsTable
  const legacyBadge = getJotyBadgeStyle(round.round_abbr)
  const wlPill = y ? getJotyPillWlV2Style(round.round_abbr) : null
  return (
    <TableRow
      className={cn(
        y ?
          "border-b border-white/[0.06] bg-black/25 hover:bg-black/25"
        : "border-border/60 bg-muted/30 hover:bg-muted/30",
        showTopBorder &&
          (y ? "border-t border-white/10" : "border-t-2 border-t-border/80"),
      )}
    >
      <TableCell
        colSpan={3}
        className={cn(y ? "!px-2 !py-1.5" : "py-2 pl-3 pr-2")}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "font-medium",
              y ? "text-[11px]" : "text-sm text-foreground",
            )}
          >
            {round.round_name}
          </span>
          {wlPill ?
            <span
              className="joty-pill"
              style={{
                background: wlPill.background,
                color: wlPill.color,
                border: `1px solid ${wlPill.borderColor}`,
              }}
            >
              {round.round_abbr}
            </span>
          : <span className={legacyBadge.className} style={legacyBadge.style}>
              {round.round_abbr}
            </span>
          }
        </div>
      </TableCell>
    </TableRow>
  )
}

function ResultRow({
  row,
  isHighlighted,
  onNavigate,
  wlHomeV2YearsTable,
}: {
  row: JotyResultRow
  isHighlighted: boolean
  onNavigate: () => void
  wlHomeV2YearsTable: boolean
}) {
  const y = wlHomeV2YearsTable
  const venueDisplay = row.show_venue_location
    ? row.show_subvenue?.trim()
      ? `${row.show_venue_location}`
      : row.show_venue_location
    : "—"

  return (
    <TableRow
      className={cn(
        "transition-colors",
        y ?
          cn(
            "border-b border-white/[0.06] bg-transparent",
            isHighlighted ?
              "bg-[rgba(88,200,174,0.18)] hover:bg-[rgba(88,200,174,0.24)]"
            : "hover:bg-[rgba(88,200,174,0.11)]",
          )
        : cn(
            "border-border/60",
            isHighlighted ? "bg-primary/20 hover:bg-primary/25" : "hover:bg-muted/50",
          ),
      )}
    >
      <TableCell
        className={cn(
          "text-left font-medium",
          y ? "!px-2 !py-0.5 text-[11px]" : "py-0.5 text-xs",
        )}
      >
        {row.song_id ?
          <Link
            href={getSongArchiveUrl(row.song_id)}
            className={cn(!y && "text-foreground", "hover:underline")}
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
      <TableCell
        className={cn(
          "text-center text-muted-foreground",
          y ?
            "whitespace-nowrap !px-2 !py-0.5 text-[11px] font-medium tabular-nums"
          : "py-0.5 text-xs",
        )}
      >
        {row.show_id ?
          <Link
            href={getSetlistArchiveUrl(row.show_id)}
            className={cn(!y && "text-foreground", "hover:underline")}
            onClick={onNavigate}
          >
            {formatShowDate(row.show_date)}
          </Link>
        : formatShowDate(row.show_date)}
      </TableCell>
      <TableCell
        className={cn(
          "whitespace-normal text-right text-muted-foreground",
          y ? "!px-2 !py-0.5 text-[11px]" : "py-0.5 text-xs",
        )}
      >
        {venueDisplay}
      </TableCell>
    </TableRow>
  )
}
