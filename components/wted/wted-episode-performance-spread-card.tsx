"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { formatSetlistDate } from "@/lib/setlist-utils"
import type { WtedEpisodeTableRow } from "@/types/wted-episode"

const COVER_CATEGORIES = ["Cover Songs", "Miscellaneous Covers"]

function songLabelFromRow(row: WtedEpisodeTableRow): string {
  const entry = row.setlistEntry
  const category = entry.songs?.song_category ?? "undefined"
  const songKey = entry.entry_song
  const rawArtist = entry.songs?.song_originalartist?.trim()
  const artist =
    rawArtist === "[Traditional]" ? "Traditional" : rawArtist
  const showArtist = COVER_CATEGORIES.includes(category) && artist
  const displayName = entry.songs?.song_displayname?.trim() || songKey
  return showArtist ? `${displayName} [${artist}]` : displayName
}

function getSongNameForSort(s: string): string {
  const bracketIdx = s.indexOf(" [")
  return bracketIdx >= 0 ? s.slice(0, bracketIdx) : s
}

type YearBucket = {
  year: string
  count: number
  /** Episode rows in this year (for tooltips). */
  items: { label: string; showDate: string }[]
}

/** True when dated rows span more than one calendar year (performance spread is useful). */
export function wtedEpisodeHasMultipleShowYears(
  rows: WtedEpisodeTableRow[],
): boolean {
  const years = new Set<string>()
  for (const row of rows) {
    const d = row.showDate?.trim()
    if (!d || d.length < 4) continue
    const y = d.slice(0, 4)
    if (!/^\d{4}$/.test(y)) continue
    years.add(y)
    if (years.size > 1) return true
  }
  return false
}

export function WtedEpisodePerformanceSpreadCard({
  rows,
  hoveredYear = null,
  onYearHover,
}: {
  rows: WtedEpisodeTableRow[]
  /** Highlights the row when it matches the hovered year (playlist sync). */
  hoveredYear?: string | null
  /** Highlights matching playlist rows; clears song-spread hover from the parent. */
  onYearHover?: (year: string | null) => void
}) {
  const isDesktop = useIsDesktopContentLayout()
  const { spread, maxCount } = useMemo(() => {
    const byYear = new Map<string, { label: string; showDate: string }[]>()
    for (const row of rows) {
      const d = row.showDate?.trim()
      if (!d || d.length < 4) continue
      const year = d.slice(0, 4)
      if (!/^\d{4}$/.test(year)) continue
      const label = songLabelFromRow(row)
      if (!byYear.has(year)) byYear.set(year, [])
      byYear.get(year)!.push({ label, showDate: d })
    }
    const years = [...byYear.keys()].sort((a, b) => a.localeCompare(b))
    const spread: YearBucket[] = years.map((year) => {
      const items = [...(byYear.get(year) ?? [])]
      return { year, count: items.length, items }
    })
    const maxCount =
      spread.length > 0 ? Math.max(...spread.map((s) => s.count)) : 0
    return { spread, maxCount }
  }, [rows])

  if (!wtedEpisodeHasMultipleShowYears(rows)) return null

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <div className="px-3 py-1.5 bg-muted/60 shrink-0">
        <h2 className="text-sm font-semibold">Performance Spread</h2>
      </div>
      <CardContent className="p-0">
        <ul className="space-y-1 text-xs max-h-[390px] md:max-h-[498px] overflow-y-auto p-3">
          {spread.map(({ year, count, items }) => {
            const sortedForTooltip = [...items].sort((a, b) => {
              const d = a.showDate.localeCompare(b.showDate)
              if (d !== 0) return d
              return getSongNameForSort(a.label).localeCompare(
                getSongNameForSort(b.label),
              )
            })
            const tooltipContent =
              sortedForTooltip.length > 0 ? (
                <ul className="list-none space-y-[1px] overflow-y-auto text-[11px] leading-tight py-1.5">
                  {sortedForTooltip.map((it, idx) => {
                    const bracketIdx = it.label.indexOf(" [")
                    const songName =
                      bracketIdx >= 0 ? it.label.slice(0, bracketIdx) : it.label
                    const artistPart =
                      bracketIdx >= 0 ? it.label.slice(bracketIdx) : null
                    const dateShown = formatSetlistDate(it.showDate)
                    return (
                      <li
                        key={`${it.showDate}-${it.label}-${idx}`}
                        className="px-3"
                      >
                        <span className="font-semibold">{songName}</span>
                        {artistPart && (
                          <span className="font-normal">{artistPart}</span>
                        )}
                        {dateShown ?
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            — {dateShown}
                          </span>
                        : null}
                      </li>
                    )
                  })}
                </ul>
              ) : null

            const barWidth = maxCount > 0 ? Math.max(4, (count / maxCount) * 100) : 0
            const isRowHovered = hoveredYear === year

            const rowContent = (
              <div
                className={`flex items-center gap-2 tabular-nums ${
                  isRowHovered ? "bg-muted/80 rounded-md px-1 -mx-1" : ""
                } ${onYearHover ? "cursor-default" : ""}`}
                onMouseEnter={() => onYearHover?.(year)}
                onMouseLeave={() => onYearHover?.(null)}
              >
                <span className="shrink-0 min-w-[2.75rem] rounded-md bg-muted px-1 py-0.5 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                  {year}
                </span>
                <div
                  className="h-4 flex-1 min-w-0 rounded-full bg-muted overflow-hidden"
                  aria-hidden
                >
                  <div
                    className={`h-full rounded-full bg-wl-orange/60 transition-all duration-200 ${
                      isRowHovered ? "opacity-100" : "opacity-80"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-muted-foreground shrink-0 text-right">
                  {count}
                </span>
              </div>
            )

            return (
              <li key={year}>
                {isDesktop && tooltipContent ?
                  <Tooltip>
                    <TooltipTrigger asChild>{rowContent}</TooltipTrigger>
                    <TooltipContent
                      side="left"
                      className="max-w-xs text-[11px] p-0"
                    >
                      <div className="w-full border-b border-black">
                        <p className="font-bold px-3 py-1 leading-tight text-sm">
                          {year}
                        </p>
                      </div>
                      {tooltipContent}
                    </TooltipContent>
                  </Tooltip>
                : rowContent}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
