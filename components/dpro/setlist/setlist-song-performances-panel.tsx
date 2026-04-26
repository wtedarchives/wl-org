"use client"

import type { ReactNode } from "react"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { getVenueArchiveUrl } from "@/lib/venue-archive-url"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { formatSetlistDate, formatEntryLength } from "@/lib/setlist-utils"
import {
  getPlacementIndexCellBg,
  shouldShowSetlistEntryShort,
} from "@/components/dpro/setlist/display-setlist-table.constants"
import { useSongTourPerformances } from "@/hooks/use-song-tour-performances"
import type { SetlistEntry } from "@/types/setlist"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { cn } from "@/lib/utils"

export interface SetlistSongPerformancesPanelProps {
  /** When false, tour-performance fetch stays idle. */
  open: boolean
  /** Called when a navigation link should close the shell (drawer/modal). */
  onDismiss: () => void
  entry: SetlistEntry | null
  /** Human-readable tour name, e.g. "Fall 2024 Tour". */
  tourName: string | null
  /** When provided with tourName, used for tour-page song click (no entry needed). */
  songName?: string | null
  songDisplayName?: string | null
  songId?: string | null
  /** Close control (e.g. DrawerClose-asChild or a plain button). Shown in panel footer when `showFooter`. */
  closeControl?: ReactNode
  /** Optional class on the outer flex column (drawer/modal body). */
  className?: string
  /** When false, omit the song / tour header block (parent supplies chrome). */
  showHeader?: boolean
  /** When false, omit link + close footer (e.g. WL Home v2 modal supplies a shell footer). */
  showFooter?: boolean
  /** WL Home v2: match {@link YearShowsTable} chrome (`wl-home-v2-years-table`). */
  wlHomeV2YearsTable?: boolean
}

/**
 * Tour performances table + header/footer — shared by {@link SetlistSongPerformancesSheet}
 * and WL Home v2 setlist song modal.
 */
export function SetlistSongPerformancesPanel({
  open,
  onDismiss,
  entry,
  tourName,
  songName: songNameProp,
  songDisplayName: songDisplayNameProp,
  songId: songIdProp,
  closeControl,
  className,
  showHeader = true,
  showFooter = true,
  wlHomeV2YearsTable = false,
}: SetlistSongPerformancesPanelProps) {
  const songName = songNameProp ?? entry?.entry_song ?? ""
  const songId = songIdProp ?? entry?.song_id ?? null

  const { performances, loading, error } = useSongTourPerformances(
    open,
    songName || null,
    tourName,
  )

  return (
    <div
      className={
        className ??
        "flex min-h-0 flex-1 flex-col overflow-hidden text-xs"
      }
    >
      {showHeader ?
        <div className="shrink-0 border-b border-border/60 pt-1 pb-3">
          {songName ?
            <div className="space-y-1 text-[11px]">
              <p className="text-sm font-medium text-foreground">
                <SongDisplayName
                  song={songName}
                  songDisplayName={
                    songDisplayNameProp ?? entry?.songs?.song_displayname
                  }
                />
              </p>
              {tourName ?
                <p className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {tourName}
                </p>
              : null}
            </div>
          : <p className="text-[11px] text-muted-foreground">
              No song selected.
            </p>}
        </div>
      : null}

      <div
        className={cn(
          "min-h-[140px] min-w-0 flex-1 overflow-y-auto",
          wlHomeV2YearsTable ?
            "wl-home-v2-years-table-scroll px-0.5 pt-0.5 pb-1.5"
          : cn(
              "max-h-[52vh] px-3 pb-3",
              showHeader ? "pt-2" : "pt-1",
            ),
        )}
      >
        {!songName ?
          <p
            className={cn(
              "text-[11px]",
              wlHomeV2YearsTable ?
                "text-white/55"
              : "text-muted-foreground",
            )}
          >
            Select a song in the setlist to view its tour performances.
          </p>
        : loading ?
          <div
            className={cn(
              "flex items-center gap-2 py-6 text-[11px]",
              wlHomeV2YearsTable ? "text-white/55" : "text-muted-foreground",
            )}
          >
            <Loader2 className="size-4 animate-spin" aria-hidden={true} />
            <span>Loading performances…</span>
          </div>
        : error ?
          <p className="text-[11px] text-destructive">{error}</p>
        : performances.length === 0 ?
          <p
            className={cn(
              "py-2 text-[11px]",
              wlHomeV2YearsTable ? "text-white/55" : "text-muted-foreground",
            )}
          >
            No performances of this song were found in this tour.
          </p>
        : <div className="w-full overflow-x-auto">
            <Table
              className={cn(
                "text-[11px]",
                wlHomeV2YearsTable ?
                  "min-w-max wl-home-v2-years-table"
                : "min-w-full border-separate border-spacing-y-0.25",
              )}
            >
              <TableHeader>
                <TableRow
                  className={cn(
                    wlHomeV2YearsTable ?
                      "border-b border-white/10 bg-black/25 hover:bg-black/25"
                    : "border-b border-border/60",
                  )}
                >
                  <TableHead
                    className={cn(
                      "whitespace-nowrap text-center text-[11px] font-medium",
                      wlHomeV2YearsTable ? "!px-2 !py-0.5" : "",
                    )}
                  >
                    Date
                  </TableHead>
                  <TableHead
                    className={cn(
                      "shrink-0 p-0",
                      wlHomeV2YearsTable ? "w-[4px]" : "w-1",
                    )}
                    aria-hidden
                  />
                  <TableHead
                    className={cn(
                      "whitespace-nowrap text-[11px] font-medium",
                      wlHomeV2YearsTable ? "!px-2 !py-0.5 text-left" : "",
                    )}
                  >
                    Venue
                  </TableHead>
                  <TableHead
                    className={cn(
                      "whitespace-nowrap text-left text-[11px] font-medium",
                      wlHomeV2YearsTable ? "!px-2 !py-0.5" : "",
                    )}
                  >
                    &nbsp;
                  </TableHead>
                  <TableHead
                    className={cn(
                      "whitespace-nowrap text-center text-[11px] font-medium",
                      wlHomeV2YearsTable ? "!px-2 !py-0.5" : "",
                    )}
                  >
                    Length
                  </TableHead>
                  <TableHead
                    className={cn(
                      "min-w-[400px] max-w-[400px] whitespace-normal text-[11px] font-medium",
                      wlHomeV2YearsTable ? "!px-2 !py-0.5 text-left" : "",
                    )}
                  >
                    Coach&apos;s Notes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performances.map((perf) => (
                  <TableRow
                    key={`${perf.show_id}-${perf.entry_id}`}
                    className={cn(
                      "align-middle",
                      wlHomeV2YearsTable ?
                        "border-b border-white/[0.06] bg-transparent transition-colors hover:bg-[rgba(88,200,174,0.11)]"
                      : "",
                    )}
                  >
                    <TableCell
                      className={cn(
                        "whitespace-nowrap text-center align-middle text-[11px]",
                        wlHomeV2YearsTable ? "!px-2 !py-0.5" : "px-2 py-1",
                      )}
                    >
                      <Link
                        href={getSetlistArchiveUrl(perf.show_id)}
                        className={cn(
                          "hover:underline",
                          wlHomeV2YearsTable && "text-inherit",
                        )}
                        onClick={() => onDismiss()}
                      >
                        {formatSetlistDate(perf.show_date)}
                      </Link>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "relative shrink-0 p-0 align-middle",
                        wlHomeV2YearsTable ? "w-[4px]" : "w-2",
                      )}
                      aria-hidden
                    >
                      {perf.entry_placement ?
                        <div
                          className="absolute inset-y-1 left-0 right-0 w-1 rounded-sm"
                          style={{
                            backgroundColor: getPlacementIndexCellBg(
                              perf.entry_placement,
                            ),
                          }}
                          aria-hidden
                        />
                      : null}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "align-middle text-[11px]",
                        wlHomeV2YearsTable ? "!px-2 !py-0.5" : "px-2 py-1",
                      )}
                    >
                      {perf.venue_id ?
                        <Link
                          href={getVenueArchiveUrl(perf.venue_id)}
                          className={cn(
                            "hover:underline",
                            wlHomeV2YearsTable && "text-inherit",
                          )}
                          onClick={() => onDismiss()}
                        >
                          {perf.show_venue_location ||
                            perf.show_subvenue ||
                            "—"}
                        </Link>
                      : <span>
                          {perf.show_venue_location || "—"}
                        </span>
                      }
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-left align-middle text-[11px]",
                        wlHomeV2YearsTable ? "!px-2 !py-0.5" : "px-2 py-1",
                      )}
                    >
                      <div className="inline-flex items-center gap-1">
                        {shouldShowSetlistEntryShort(
                          perf.entry_song,
                          perf.entry_short,
                        ) && (
                          <span className="text-[0.625rem] text-red-400">
                            [{perf.entry_short}]
                          </span>
                        )}
                        {perf.entry_segue && (
                          <span className="text-[0.625rem] text-red-400">
                            →
                            {perf.entry_segue.replace(/^>\s*/, "").trim()}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "whitespace-nowrap text-center align-middle text-[11px]",
                        wlHomeV2YearsTable ? "!px-2 !py-0.5" : "px-2 py-1",
                      )}
                    >
                      {formatEntryLength(perf.entry_length) || ""}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "min-w-[400px] max-w-[400px] whitespace-normal align-middle text-[11px]",
                        wlHomeV2YearsTable ? "!px-2 !py-0.5" : "px-2 py-1",
                      )}
                    >
                      {perf.entry_coachnotes && (
                        <div className="text-[10px] leading-tight text-muted-foreground [&_a]:font-semibold [&_a]:text-wl-orange [&_a]:hover:underline [&_p]:my-0">
                          <span
                            dangerouslySetInnerHTML={{
                              __html: perf.entry_coachnotes.trim(),
                            }}
                          />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        }
      </div>

      {showFooter ?
        <div className="shrink-0 border-t border-border/60 pt-3">
          <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              {songId ?
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link
                    href={getSongArchiveUrl(songId)}
                    onClick={() => onDismiss()}
                  >
                    View full song history
                  </Link>
                </Button>
              : null}
              {closeControl}
            </div>
          </div>
        </div>
      : null}
    </div>
  )
}
