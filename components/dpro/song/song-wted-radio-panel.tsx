"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatSetlistDate } from "@/lib/setlist-utils"
import { getSetlistArchiveUrl } from "@/lib/setlist-archive-url"
import { getWtedEpisodeUrl } from "@/lib/wted-episode-url"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { cn } from "@/lib/utils"
import type { SongWtedAirplayGroup } from "@/types/song-wted-airplay"

interface SongWtedRadioPanelProps {
  groups: SongWtedAirplayGroup[]
  loading: boolean
}

export function SongWtedRadioPanel({
  groups,
  loading,
}: SongWtedRadioPanelProps) {
  if (!loading && groups.length === 0) return null

  return (
    <Card className="border-border/60 bg-card/80 flex h-full min-h-0 flex-col overflow-hidden py-0">
      <CardHeader className="bg-muted/60 shrink-0 py-2">
        <CardTitle className="text-sm font-semibold">WTED Radio</CardTitle>
        <p className="text-muted-foreground text-[0.65rem] font-normal leading-snug">
          Performances that appeared in episodes on WTED Radio
        </p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-0 pt-0">
        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 px-3 py-8 text-xs">
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            Loading WTED…
          </div>
        ) : (
          <ul
            className={cn(
              "max-h-[min(70vh,28rem)] min-h-0 divide-y divide-border/60 overflow-y-auto",
              "px-0",
            )}
          >
            {groups.map((group) => {
              const dateText = group.showDate
                ? formatSetlistDate(group.showDate)
                : null
              const hasHeader =
                Boolean(dateText) || Boolean(group.venueLocation?.trim())
              const rowKey =
                group.showId
                ?? `dv:${group.showDate ?? ""}:${group.venueLocation ?? ""}`

              return (
                <li key={rowKey} className="px-3 py-1.5">
                  <div className="min-w-0 space-y-1">
                    <div className="text-xs font-medium leading-snug text-foreground">
                      {hasHeader ? (
                        <>
                          {dateText ?
                            group.showId ?
                              <Link
                                href={getSetlistArchiveUrl(group.showId)}
                                className="hover:underline"
                              >
                                {dateText}
                              </Link>
                            : <span>{dateText}</span>
                          : null}
                          {dateText && group.venueLocation?.trim() ?
                            " – "
                          : null}
                          {group.venueLocation?.trim() ?
                            <span>{group.venueLocation}</span>
                          : null}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    <ul className="space-y-0.5 border-l border-border/60 pl-2.5">
                      {group.episodes.map((ep) => {
                        const epLabel = getWtedEpisodeDisplayName(
                          ep.episodeCode,
                          ep.episodeDisplayName,
                        )
                        const series = ep.wtedSeries?.trim() ?? ""
                        return (
                          <li key={ep.eeUuid} className="min-w-0">
                            <div className="flex flex-wrap items-baseline gap-x-1 text-xs leading-snug">
                              {series ? (
                                <>
                                  <span className="text-muted-foreground text-[0.65rem] pr-2">
                                    {series}
                                  </span>
                                </>
                              ) : null}
                              <Link
                                href={getWtedEpisodeUrl(ep.episodeUuid)}
                                className="text-foreground min-w-0 font-normal hover:underline"
                              >
                                {epLabel}
                              </Link>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
