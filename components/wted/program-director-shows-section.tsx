"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import type { ProgramDirectorShow } from "@/hooks/use-program-director-data"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { getWtedEpisodeUrl } from "@/lib/wted-episode-url"
import { cn } from "@/lib/utils"

const SHOW_COLUMNS_CLASS =
  "columns-1 gap-x-4 space-y-4 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5"

export function ProgramDirectorShowsSection({
  isV2,
  showsWithEpisodes,
  onOpenShowInfo,
}: {
  isV2: boolean
  showsWithEpisodes: ProgramDirectorShow[]
  onOpenShowInfo: (showTitle: string, description: string) => void
}) {
  if (isV2) {
    return (
      <section
        className="wl-home-v2-pd-shows-grid"
        aria-labelledby="wl-home-v2-pd-shows-heading"
      >
        <h2 id="wl-home-v2-pd-shows-heading" className="wl-home-v2-pd-shows-grid-label">
          Shows
        </h2>
        {showsWithEpisodes.length === 0 ?
          <p className="col-span-full px-7 py-10 text-center text-xs italic text-white/50 sm:px-8">
            No shows with episodes to display.
          </p>
        : showsWithEpisodes.map((showItem) => (
            <article key={showItem.show} className="wl-home-v2-pd-show-cell">
              <div className="wl-home-v2-pd-show-cell-head">
                <h3 className="wl-home-v2-pd-show-cell-title">
                  {showItem.show}
                </h3>
                {showItem.description ?
                  <button
                    type="button"
                    onClick={() => {
                      const d = showItem.description
                      if (d) onOpenShowInfo(showItem.show, d)
                    }}
                    className={cn(
                      "shrink-0 rounded-full border border-white/25 bg-[rgba(255,122,103,0.35)] px-2! py-0.5! text-[10px] font-semibold uppercase tracking-wide text-white",
                      "transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wl-light-orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#313a34]",
                    )}
                  >
                    info
                  </button>
                : null}
              </div>
              <ul>
                {showItem.episodes.map((ep) => (
                  <li key={ep.uuid}>
                    {ep.hasEntries ?
                      <Link
                        href={getWtedEpisodeUrl(ep.uuid)}
                        className="pd-ep-link"
                      >
                        <span className="pd-ep-line">
                          {ep.artwork?.trim() ?
                            <span className="pd-ep-thumb relative size-5 shrink-0 overflow-hidden rounded border border-white/15">
                              <Image
                                src={ep.artwork}
                                alt=""
                                width={28}
                                height={28}
                                className="size-5 object-cover"
                                unoptimized
                              />
                            </span>
                          : null}
                          <span className="pd-ep-title">
                            {getWtedEpisodeDisplayName(
                              ep.episode,
                              ep.display_name,
                            )}
                          </span>
                        </span>
                      </Link>
                    : <div className="pd-ep-static">
                        <span className="pd-ep-line">
                          {ep.artwork?.trim() ?
                            <span className="pd-ep-thumb relative size-5 shrink-0 overflow-hidden rounded border border-white/15 opacity-90">
                              <Image
                                src={ep.artwork}
                                alt=""
                                width={28}
                                height={28}
                                className="size-5 object-cover"
                                unoptimized
                              />
                            </span>
                          : null}
                          <span className="pd-ep-title">
                            {getWtedEpisodeDisplayName(
                              ep.episode,
                              ep.display_name,
                            )}
                          </span>
                        </span>
                      </div>
                    }
                  </li>
                ))}
              </ul>
            </article>
          ))
        }
      </section>
    )
  }

  return (
    <div className="mb-8 w-full min-w-0 space-y-3 pb-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Shows
      </h2>
      {showsWithEpisodes.length === 0 ?
        <p className="text-xs italic text-muted-foreground">
          No shows with episodes to display.
        </p>
      : <div className={SHOW_COLUMNS_CLASS}>
          {showsWithEpisodes.map((showItem) => (
            <Card
              key={showItem.show}
              className="break-inside-avoid overflow-hidden rounded-lg border border-border/60 bg-background/70 py-0 shadow-sm"
            >
              <div className="bg-muted/60 flex flex-row items-center justify-between gap-2 py-1.5 pl-4 pr-2">
                <CardTitle className="min-w-0 flex-1 truncate pr-1.5 text-sm font-medium">
                  {showItem.show}
                </CardTitle>
                {showItem.description ?
                  <button
                    type="button"
                    onClick={() => {
                      const d = showItem.description
                      if (d) onOpenShowInfo(showItem.show, d)
                    }}
                    className={cn(
                      "shrink-0 rounded-full border border-wl-dark-grey/50 bg-wl-orange/40 px-2! py-0.5! text-[10px] font-semibold uppercase tracking-wide text-wl-white",
                      "transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                  >
                    info
                  </button>
                : null}
              </div>
              <CardContent className="p-0">
                <ul>
                  {showItem.episodes.map((ep) => (
                    <li
                      key={ep.uuid}
                      className="transition-colors hover:bg-muted/25"
                    >
                      {ep.hasEntries ?
                        <Link
                          href={getWtedEpisodeUrl(ep.uuid)}
                          className="flex items-center gap-2 py-0.5 pl-2.5 pr-2 text-xs font-medium leading-tight text-foreground hover:underline"
                        >
                          {ep.artwork?.trim() ?
                            <span className="relative size-5 shrink-0 overflow-hidden rounded border border-border sm:size-5">
                              <Image
                                src={ep.artwork}
                                alt=""
                                width={28}
                                height={28}
                                className="size-5 object-cover sm:size-5"
                                unoptimized
                              />
                            </span>
                          : null}
                          <span className="min-w-0 flex-1 leading-tight">
                            {getWtedEpisodeDisplayName(
                              ep.episode,
                              ep.display_name,
                            )}
                          </span>
                        </Link>
                      : <div className="flex items-center gap-2 py-0.5 pl-2.5 pr-2 text-xs font-normal leading-tight text-muted-foreground sm:min-h-0">
                          {ep.artwork?.trim() ?
                            <span className="relative size-5 shrink-0 overflow-hidden rounded border border-border opacity-90 sm:size-5">
                              <Image
                                src={ep.artwork}
                                alt=""
                                width={28}
                                height={28}
                                className="size-5 object-cover sm:size-5"
                                unoptimized
                              />
                            </span>
                          : null}
                          <span className="min-w-0 flex-1 leading-tight">
                            {getWtedEpisodeDisplayName(
                              ep.episode,
                              ep.display_name,
                            )}
                          </span>
                        </div>
                      }
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    </div>
  )
}
