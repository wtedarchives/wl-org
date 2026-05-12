"use client"

import Link from "next/link"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { cn } from "@/lib/utils"
import type { PlacementRow } from "@/hooks/use-popular-placements-data"
import { PopularPlacementsCategoryThumb } from "@/components/dpro/lists/popular-placements-category-thumbs"

export function PopularPlacementsWlRankedRows({
  items,
}: {
  items: PlacementRow[]
}) {
  return (
    <>
      {items.map((row, i) => {
        const displayRank =
          i === 0 || items[i].times_played !== items[i - 1].times_played
            ? i + 1
            : null
        return (
          <tr
            key={row.song_id}
            className={cn(
              "transition-colors",
              "border-b border-[rgb(34,37,35)] bg-transparent hover:bg-[rgba(88,200,174,0.11)] [&:last-child]:border-b-0",
            )}
          >
            <td className="wl-home-v2-top-slots-stats-cell">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  {displayRank != null ?
                    <span
                      className="w-4 shrink-0 text-right text-[10px] tabular-nums text-white/55"
                      aria-hidden
                    >
                      {displayRank}
                    </span>
                  : <span className="w-4 shrink-0" aria-hidden />}
                  <Link
                    href={getSongArchiveUrl(row.song_id)}
                    className="min-w-0 cursor-pointer text-left font-medium text-white/88 hover:underline"
                  >
                    <SongDisplayName
                      song={row.song_name}
                      songDisplayName={row.song_displayname}
                    />
                  </Link>
                </div>
                {row.category_artwork ?
                  <PopularPlacementsCategoryThumb src={row.category_artwork} />
                : null}
              </div>
            </td>
            <td
              className={cn(
                "w-[30px] min-w-[30px] text-center font-medium tabular-nums",
                "wl-home-v2-top-slots-stats-cell text-white/88",
              )}
            >
              {row.times_played}
            </td>
          </tr>
        )
      })}
    </>
  )
}
