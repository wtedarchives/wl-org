"use client"

import { getSongArchiveUrl } from "@/lib/song-archive-url"
import Link from "next/link"
import { CircleNotch } from "@phosphor-icons/react"

import {
  SetlistSongPerformanceTableRow,
} from "@/components/dpro/setlist/setlist-song-performance-table-row"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { useSongUserPerformances } from "@/hooks/use-song-user-performances"
import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

export interface UserSongPerformancesPanelProps {
  /** When false, user-performance fetch stays idle. */
  open: boolean
  /** Called when a navigation link should close the shell (drawer/modal). */
  onDismiss: () => void
  songName: string | null
  songDisplayName?: string | null
  songId?: string | null
  userId: string | null
  attendedShowIds: string[]
  /** e.g. "Your shows" or "Attended shows". Shown in header when `showHeader`. */
  scopeLabel?: string | null
  closeControl?: ReactNode
  className?: string
  showHeader?: boolean
  showFooter?: boolean
  wlHomeV2YearsTable?: boolean
}

/**
 * Attended-show performances table — shared by profile song drawer/modal shells.
 */
export function UserSongPerformancesPanel({
  open,
  onDismiss,
  songName,
  songDisplayName,
  songId,
  userId,
  attendedShowIds,
  scopeLabel,
  closeControl,
  className,
  showHeader = true,
  showFooter = true,
  wlHomeV2YearsTable = false,
}: UserSongPerformancesPanelProps) {
  const { performances, loading, error } = useSongUserPerformances(
    open,
    songName,
    userId,
    attendedShowIds,
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
                  songDisplayName={songDisplayName}
                />
              </p>
              {scopeLabel ?
                <p className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {scopeLabel}
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
            Select a song to view its performances at attended shows.
          </p>
        : loading ?
          <div
            className={cn(
              "flex items-center gap-2 py-6 text-[11px]",
              wlHomeV2YearsTable ? "text-white/55" : "text-muted-foreground",
            )}
          >
            <CircleNotch className="size-4 animate-spin" aria-hidden />
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
            No performances of this song were found at attended shows.
          </p>
        : <div className="w-full overflow-x-auto">
            <Table
              className={cn(
                "text-[11px]",
                wlHomeV2YearsTable ?
                  "min-w-max set-table"
                : "min-w-full border-separate border-spacing-y-0.25",
              )}
            >
              <TableHeader>
                <TableRow
                  className={cn(
                    !wlHomeV2YearsTable && "border-b border-border/60",
                  )}
                >
                  <TableHead
                    className={cn(
                      wlHomeV2YearsTable ?
                        "center whitespace-nowrap"
                      : "whitespace-nowrap text-center text-[11px] font-medium px-2 py-0.5",
                    )}
                  >
                    Date
                  </TableHead>
                  <TableHead
                    className={cn(
                      wlHomeV2YearsTable ? "set-table-perf-head" : "w-1 shrink-0 p-0",
                    )}
                    aria-hidden
                  />
                  <TableHead
                    className={
                      wlHomeV2YearsTable ?
                        "whitespace-nowrap"
                      : cn(
                          "whitespace-nowrap text-left text-[11px] font-medium",
                          "px-2 py-0.5",
                        )
                    }
                  >
                    Venue
                  </TableHead>
                  <TableHead
                    className={
                      wlHomeV2YearsTable ?
                        "text-left whitespace-nowrap"
                      : cn(
                          "whitespace-nowrap text-left text-[11px] font-medium",
                          "px-2 py-0.5",
                        )
                    }
                  >
                    &nbsp;
                  </TableHead>
                  <TableHead
                    className={cn(
                      wlHomeV2YearsTable ?
                        "center whitespace-nowrap"
                      : cn(
                          "whitespace-nowrap text-center text-[11px] font-medium px-2 py-0.5",
                        ),
                    )}
                  >
                    Length
                  </TableHead>
                  <TableHead
                    className={cn(
                      wlHomeV2YearsTable ?
                        "max-w-[400px] min-w-0 whitespace-normal text-left"
                      : cn(
                          "max-w-[400px] min-w-0 whitespace-normal text-left text-[11px] font-medium",
                          "px-2 py-0.5",
                        ),
                    )}
                  >
                    Coach&apos;s Notes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performances.map((perf) => (
                  <SetlistSongPerformanceTableRow
                    key={`${perf.show_id}-${perf.entry_id}`}
                    perf={perf}
                    onDismiss={onDismiss}
                    wlHomeV2YearsTable={wlHomeV2YearsTable}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        }
      </div>

      {showFooter ?
        <div className="shrink-0 border-t border-border/60 pt-3">
          <div className="flex flex-col items-stretch justify-end gap-2 xl:flex-row xl:items-center">
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
