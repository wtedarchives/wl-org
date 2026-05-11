"use client"

import { Fragment, useState } from "react"
import { ChevronDown, ChevronRight, ArrowRight } from "lucide-react"
import { SongDisplayName } from "@/components/dpro/song-display-name"
import { cn } from "@/lib/utils"
import type { SegueDestination, SegueSourceRow } from "@/hooks/use-segues-data"
import { WlHomeV2ListArchiveShowHeader } from "@/components/dpro/lists/wl-home-v2-list-archive-show-header"

export function toggleSegueExpandedRow(
  expandedId: string | null,
  rowId: string,
): string | null {
  return expandedId === rowId ? null : rowId
}

function SeguesWlCategoryThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <span className="inline-flex shrink-0 items-center !pr-2">
      <img
        src={src}
        alt=""
        className="size-5 shrink-0 rounded border border-[rgb(63,65,64)] object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  )
}

export function SeguesWlArchiveBody({
  listName,
  listDescription,
  segues,
  expandedId,
  setExpandedId,
  onDestinationClick,
}: {
  listName: string
  listDescription?: string | null
  segues: SegueSourceRow[]
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  onDestinationClick: (
    source: SegueSourceRow,
    dest: SegueDestination,
  ) => void
}) {
  return (
    <div className="wl-home-v2-setlist flex min-w-0 flex-1 flex-col">
      <section className="wl-home-v2-segues-archive wl-home-v2-years-tile wl-home-v2-years-tile--main flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="wl-home-v2-years-tile-inner flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <WlHomeV2ListArchiveShowHeader
            listName={listName}
            listDescription={listDescription}
          />

          <div className="widget-panel w-full min-w-0 flex-1">
            <div className="wp-head wl-home-v2-years-shows-wp-head">
              <span className="min-w-0 truncate">Most Common Segues</span>
            </div>
            {segues.length === 0 ?
              <div className="px-3 py-2 text-xs text-white/55">No data</div>
            : <div className="min-w-0">
                <table
                  className="w-full min-w-max border-collapse text-[11px] leading-3 wl-home-v2-years-table wl-home-v2-top-slots-stats-table"
                >
                  <tbody>
                    {segues.map((row, i) => {
                      const displayRank =
                        i === 0 || segues[i].count !== segues[i - 1].count
                          ? i + 1
                          : null
                      const isExpanded = expandedId === row.song_id
                      return (
                        <Fragment key={row.song_id}>
                          <tr
                            className={cn(
                              "cursor-pointer transition-colors",
                              "border-b border-[rgb(34,37,35)] bg-transparent hover:bg-[rgba(88,200,174,0.11)] [&:last-child]:border-b-0",
                            )}
                            onClick={() =>
                              setExpandedId(
                                toggleSegueExpandedRow(
                                  expandedId,
                                  row.song_id,
                                ),
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                setExpandedId(
                                  toggleSegueExpandedRow(
                                    expandedId,
                                    row.song_id,
                                  ),
                                )
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-expanded={isExpanded}
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
                                  <span className="min-w-0 text-left font-medium text-white/88">
                                    <SongDisplayName
                                      song={row.song_name}
                                      songDisplayName={row.song_displayname}
                                    />
                                  </span>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  {row.category_artwork ?
                                    <SeguesWlCategoryThumb
                                      src={row.category_artwork}
                                    />
                                  : null}
                                  {isExpanded ?
                                    <ChevronDown
                                      className="size-4 shrink-0 text-white/55"
                                      aria-hidden
                                    />
                                  : <ChevronRight
                                      className="size-4 shrink-0 text-white/55"
                                      aria-hidden
                                    />
                                  }
                                </div>
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
                          {isExpanded &&
                            row.destinations.map((dest) => (
                              <tr
                                key={`${row.song_id}-${dest.song_id}`}
                                className={cn(
                                  "wl-home-v2-segues-sub-row",
                                  "animate-in fade-in slide-in-from-top-1 duration-200",
                                  "border-b border-[rgb(34,37,35)] bg-transparent [&:last-child]:border-b-0",
                                  "transition-colors hover:bg-[rgba(88,200,174,0.11)]",
                                )}
                              >
                                <td className="wl-home-v2-top-slots-stats-cell">
                                  <div className="flex min-w-0 items-center justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-1.5">
                                      <ArrowRight
                                        className="size-3.5 shrink-0 text-destructive"
                                        aria-hidden
                                      />
                                      <button
                                        type="button"
                                        className="min-w-0 cursor-pointer truncate text-left font-medium text-white/88 hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded"
                                        onClick={() =>
                                          onDestinationClick(row, dest)
                                        }
                                      >
                                        <SongDisplayName
                                          song={dest.song_name}
                                          songDisplayName={dest.song_displayname}
                                        />
                                      </button>
                                    </div>
                                    {dest.category_artwork ?
                                      <SeguesWlCategoryThumb
                                        src={dest.category_artwork}
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
                                  {dest.count}
                                </td>
                              </tr>
                            ))}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      </section>
    </div>
  )
}
