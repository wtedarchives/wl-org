"use client"

import { useMemo, type CSSProperties } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useIsDesktopContentLayout } from "@/hooks/use-mobile"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { cn } from "@/lib/utils"
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
  visualVariant = "default",
}: {
  rows: WtedEpisodeTableRow[]
  /** Highlights the row when it matches the hovered year (playlist sync). */
  hoveredYear?: string | null
  /** Highlights matching playlist rows; clears song-spread hover from the parent. */
  onYearHover?: (year: string | null) => void
  visualVariant?: "default" | "wl-home-v2"
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

  const isV2 = visualVariant === "wl-home-v2"

  const list = (
    <ul
      className={cn(
        "space-y-1 text-xs",
        isV2 ?
          "wl-home-v2-setlist-song-spread-ul max-h-[min(420px,55vh)] overflow-y-auto py-0.5"
        : "max-h-[390px] overflow-y-auto p-3 md:max-h-[498px]",
      )}
    >
      {spread.map(({ year, count, items }) => {
        const sortedForTooltip = [...items].sort((a, b) => {
          const d = a.showDate.localeCompare(b.showDate)
          if (d !== 0) return d
          return getSongNameForSort(a.label).localeCompare(
            getSongNameForSort(b.label),
          )
        })
        const tooltipSongList =
          sortedForTooltip.length > 0 ?
            <ul
              className={cn(
                "list-none space-y-0.5 overflow-y-auto leading-tight",
                isV2 ?
                  "wl-home-v2-setlist-song-spread-tooltip-songs max-h-[min(280px,40vh)] py-1 text-[12px] text-white/88"
                : "space-y-[1px] py-1.5 text-[11px]",
                !isV2 && "px-3",
              )}
            >
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
                    className={cn(!isV2 && "px-3", isV2 && "px-0")}
                  >
                    <span className="font-semibold">{songName}</span>
                    {artistPart ?
                      <span
                        className={cn(
                          "font-normal",
                          isV2 && "text-white/75",
                        )}
                      >
                        {artistPart}
                      </span>
                    : null}
                    {dateShown ?
                      <span
                        className={cn(
                          "font-normal",
                          isV2 ? "text-white/72" : "text-muted-foreground",
                        )}
                      >
                        {" "}
                        — {dateShown}
                      </span>
                    : null}
                  </li>
                )
              })}
            </ul>
          : null

        const barWidth =
          maxCount > 0 ? Math.max(4, (count / maxCount) * 100) : 0
        const isRowHovered = hoveredYear === year

        const rowContent = (
          <div
            className={cn(
              "flex items-center gap-2 tabular-nums",
              isV2 &&
                cn(
                  "wl-home-v2-setlist-song-spread-row rounded-md px-0.5 -mx-0.5",
                  isRowHovered && "wl-home-v2-setlist-song-spread-row--hover",
                ),
              !isV2 &&
                isRowHovered &&
                "rounded-md bg-muted/80 px-1 -mx-1",
              onYearHover && "cursor-default",
            )}
            onMouseEnter={() => onYearHover?.(year)}
            onMouseLeave={() => onYearHover?.(null)}
          >
            <span
              className={cn(
                "flex h-6 shrink-0 items-center justify-center overflow-hidden rounded-sm text-center text-xs font-semibold tabular-nums",
                isV2 ?
                  "wl-home-v2-setlist-song-spread-icon w-11 max-w-11 truncate px-0.5 text-[11px] text-white/70"
                : "min-w-[2.75rem] rounded-md bg-muted px-1 py-0.5 text-muted-foreground",
              )}
              title={year}
            >
              {year}
            </span>
            {isV2 ?
              <div
                className="wl-home-v2-setlist-song-spread-track wl-home-v2-setlist-song-spread-track--proportion flex min-h-5 min-w-0 flex-1 items-center justify-start"
                aria-hidden
              >
                <div
                  className="wl-home-v2-setlist-song-spread-proportion-fill"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            : <div
                className="wted-episode-spread-bar-track h-4 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
                style={
                  {
                    "--wted-episode-spread-bar-pct": `${barWidth}%`,
                  } as CSSProperties
                }
                aria-hidden
              >
                <div
                  className={cn(
                    "wted-episode-spread-bar-fill h-full rounded-full bg-wl-orange/60 transition-all duration-200",
                    isRowHovered ? "opacity-100" : "opacity-80",
                  )}
                />
              </div>
            }
            <span
              className={cn(
                "shrink-0 text-right tabular-nums",
                isV2 &&
                  "wl-home-v2-setlist-song-spread-count inline-block text-[13px] text-white/55",
                !isV2 && "text-muted-foreground",
              )}
              style={
                isV2 && maxCount >= 10 ?
                  { minWidth: `${String(maxCount).length}ch` }
                : undefined
              }
            >
              {count}
            </span>
          </div>
        )

        const tooltipBody =
          isV2 && tooltipSongList ?
            <div className="wl-home-v2-setlist-song-spread-tooltip-inner text-left">
              <p className="wl-home-v2-setlist-song-spread-tooltip-title">
                {year}
              </p>
              {tooltipSongList}
            </div>
          : tooltipSongList ?
            <>
              <div className="w-full border-b border-black">
                <p className="px-3 py-1 text-sm font-bold leading-tight">
                  {year}
                </p>
              </div>
              {tooltipSongList}
            </>
          : null

        return (
          <li key={year}>
            {isDesktop && tooltipBody ?
              <Tooltip>
                <TooltipTrigger asChild>{rowContent}</TooltipTrigger>
                <TooltipContent
                  side="left"
                  sideOffset={6}
                  className={cn(
                    "max-w-xs p-0",
                    isV2 ? "setlist-header-tooltip" : "text-[11px]",
                  )}
                >
                  {tooltipBody}
                </TooltipContent>
              </Tooltip>
            : rowContent}
          </li>
        )
      })}
    </ul>
  )

  if (visualVariant === "wl-home-v2") {
    return (
      <section className="wl-home-v2-years-tile wl-home-v2-tile-bg--newbg4">
        <div className="wl-home-v2-years-tile-inner">
          <div className="side-card wl-home-v2-setlist-song-spread-side-card">
            <div className="sc-label">Performance Spread</div>
            {list}
          </div>
        </div>
      </section>
    )
  }

  return (
    <Card className="ring-0 border border-border/60 bg-card/80 overflow-hidden py-0">
      <div className="px-3 py-1.5 bg-muted/60 shrink-0">
        <h2 className="text-sm font-semibold">Performance Spread</h2>
      </div>
      <CardContent className="p-0">{list}</CardContent>
    </Card>
  )
}
