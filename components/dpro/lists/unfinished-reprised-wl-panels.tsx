"use client"

import Link from "next/link"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { getSongArchiveUrl } from "@/lib/song-archive-url"
import { cn } from "@/lib/utils"
import type {
  SandwichRow,
  UnfinishedRow,
} from "@/hooks/use-unfinished-reprised-data"
import { UnfinishedReprisedCategoryThumb } from "@/components/dpro/lists/unfinished-reprised-category-thumbs"

export function UnfinishedWlPanel({ rows }: { rows: UnfinishedRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="widget-panel w-full min-w-0 flex-1">
        <div className="wp-head wl-home-v2-years-shows-wp-head">
          <span className="min-w-0 truncate">Most Common Unfinished</span>
        </div>
        <div className="px-3 py-2 text-xs text-white/55">No data</div>
      </div>
    )
  }

  return (
    <div className="widget-panel w-full min-w-0 flex-1 overflow-hidden">
      <div className="wp-head wl-home-v2-years-shows-wp-head">
        <span className="min-w-0 truncate">Most Common Unfinished</span>
      </div>
      <div className="wl-home-v2-years-table-scroll min-w-0 overflow-x-auto">
        <table
          className="w-full min-w-max border-collapse text-[11px] leading-3 wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
        >
          <tbody>
            {rows.map((row, i) => {
              const displayRank =
                i === 0 || rows[i].count !== rows[i - 1].count ? i + 1 : null
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
                        <UnfinishedReprisedCategoryThumb
                          src={row.category_artwork}
                        />
                      : null}
                    </div>
                  </td>
                  <td
                    className={cn(
                      "w-[30px] min-w-[30px] text-center font-medium tabular-nums",
                      "wl-home-v2-top-slots-stats-cell text-white/88",
                    )}
                  >
                    {row.count}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ReprisesWlPanel({
  rows,
  onSandwichClick,
}: {
  rows: SandwichRow[]
  onSandwichClick: (row: SandwichRow) => void
}) {
  if (rows.length === 0) {
    return (
      <div className="widget-panel w-full min-w-0 flex-1">
        <div className="wp-head wl-home-v2-years-shows-wp-head">
          <span className="min-w-0 truncate">Most Common Reprises</span>
        </div>
        <div className="px-3 py-2 text-xs text-white/55">No data</div>
      </div>
    )
  }

  return (
    <div className="widget-panel w-full min-w-0 flex-1 overflow-hidden">
      <div className="wp-head wl-home-v2-years-shows-wp-head">
        <span className="min-w-0 truncate">Most Common Reprises</span>
      </div>
      <div className="wl-home-v2-years-table-scroll min-w-0 overflow-x-auto">
        <table
          className="wl-home-v2-unfinished-reprised-reprises-table w-full min-w-max border-collapse text-[11px] wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
        >
          <tbody>
            {rows.map((row, i) => {
              const displayRank =
                i === 0 || rows[i].count !== rows[i - 1].count ? i + 1 : null
              return (
                <tr
                  key={row.songs.map((s) => s.song_id).join("|")}
                  className={cn(
                    "wl-home-v2-unfinished-reprised-reprises-row transition-colors",
                    "border-b border-[rgb(34,37,35)] bg-transparent hover:bg-[rgba(88,200,174,0.11)] [&:last-child]:border-b-0",
                  )}
                >
                  <td className="wl-home-v2-top-slots-stats-cell">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {displayRank != null ?
                        <span
                          className="w-4 shrink-0 text-right text-[10px] tabular-nums text-white/55"
                          aria-hidden
                        >
                          {displayRank}
                        </span>
                      : <span className="w-4 shrink-0" aria-hidden />}
                      <button
                        type="button"
                        onClick={() => onSandwichClick(row)}
                        className="min-w-0 cursor-pointer whitespace-nowrap text-left font-medium text-white/88 hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded"
                      >
                        {row.songs.map((s, j) => (
                          <span key={`${s.song_id}-${j}`}>
                            {j > 0 && (
                              <span className="text-destructive"> → </span>
                            )}
                            <SongDisplayName
                              compactInline
                              song={s.song_name}
                              songDisplayName={s.song_displayname}
                            />
                          </span>
                        ))}
                      </button>
                    </div>
                  </td>
                  <td
                    className={cn(
                      "w-[30px] min-w-[30px] text-center font-medium tabular-nums",
                      "wl-home-v2-top-slots-stats-cell text-white/88",
                    )}
                  >
                    {row.count}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
