"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useId, useMemo, useState } from "react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { useProgramDirectorData } from "@/hooks/use-program-director-data"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { getWtedEpisodeDisplayName } from "@/lib/wted-episode-display-name"
import { getWtedEpisodeUrl } from "@/lib/wted-episode-url"
import { cn } from "@/lib/utils"
import { SHOWS_INTRO } from "@/app/(main)/wted/shows/content"

const SHOW_COLUMNS_CLASS =
  "columns-1 gap-x-4 space-y-4 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5"

export function ProgramDirectorContent({
  variant = "legacy",
}: {
  variant?: "legacy" | "wl-home-v2"
}) {
  const { shows, loading, error } = useProgramDirectorData()
  const showsWithEpisodes = useMemo(
    () => shows.filter((s) => s.episodes.length > 0),
    [shows],
  )
  const [showInfo, setShowInfo] = useState<{
    showTitle: string
    description: string
  } | null>(null)

  const isV2 = variant === "wl-home-v2"
  const pdShowInfoHeadingId = useId()
  const pdShowInfoDescId = useId()

  useEffect(() => {
    if (!isV2 || showInfo == null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowInfo(null)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isV2, showInfo])

  useWlHomeV2ScrollLock(isV2 && showInfo != null)

  if (loading) {
    if (isV2) {
      return (
        <WlHomeV2PageLoading message="Loading program director data…" />
      )
    }
    return <LoadingPageCard message="Loading program director data…" />
  }

  if (error) {
    if (isV2) {
      return (
        <div className="flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
          <div className="widget-panel py-10 text-center">
            <p className="text-sm text-white/65">
              Could not load Program Director data. Please reload the page.
            </p>
          </div>
        </div>
      )
    }
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden">
        <div className="flex flex-1 items-center justify-center py-12">
          <p className="text-center text-sm text-muted-foreground">
            Could not load Program Director data. Please reload the page.
          </p>
        </div>
      </div>
    )
  }

  const introP1 =
    "WTED Goose Radio features a slate of regularly occurring shows covering a wide range of topics and experiences — from seasonal tour mixes and highlights from special tours like Taboose, to listener-curated shows, events, and partnerships with friends of WTED. Check the schedule on our homepage or in our iOS and Android apps and tune in regularly."

  return (
    <div
      className={
        isV2 ?
          "flex min-h-0 w-full flex-1 flex-col"
        : "flex flex-1 flex-col gap-4 p-4 md:p-6 rounded-b-none md:rounded-b-xl overflow-hidden"
      }
    >
      {isV2 ?
        <div
          className={"modal-backdrop" + (showInfo != null ? " open" : "")}
          id="pd-show-info-modal"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowInfo(null)
          }}
        >
          {showInfo != null ?
            <div
              className="modal modal--wted-request modal--pd-show-info"
              role="dialog"
              aria-modal="true"
              aria-labelledby={pdShowInfoHeadingId}
              aria-describedby={pdShowInfoDescId}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-request-head">
                <div className="modal-request-head-text">
                  <h3 id={pdShowInfoHeadingId}>{showInfo.showTitle}</h3>
                </div>
                <button
                  type="button"
                  className="modal-request-close"
                  onClick={() => setShowInfo(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="modal-request-body">
                <div className="modal-pd-show-info-scroll">
                  <p
                    id={pdShowInfoDescId}
                    className="modal-pd-show-info-text"
                  >
                    {showInfo.description}
                  </p>
                </div>
              </div>
            </div>
          : null}
        </div>
      : <Dialog
          open={showInfo != null}
          onOpenChange={(open) => {
            if (!open) setShowInfo(null)
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{showInfo?.showTitle}</DialogTitle>
            </DialogHeader>
            <p className="text-xs/relaxed whitespace-pre-wrap text-muted-foreground">
              {showInfo?.description}
            </p>
          </DialogContent>
        </Dialog>
      }

      {isV2 ?
        <header className="wl-home-v2-page-lede">
          <h1>WTED Radio Program Director</h1>
          <div className="wl-home-v2-page-lede-body">
            <p>{introP1}</p>
            <p>
              Have an idea or want to contribute? Become a GORP (Goose Obsessed
              Radio Personality) over at the{" "}
              <Link
                href={SHOWS_INTRO.communityUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {SHOWS_INTRO.communityLabel}
              </Link>{" "}
              — the limits of WTED are driven only by the creativity of listeners
              like you.
            </p>
          </div>
        </header>
      : <div className="mb-1 w-full">
          <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm py-0">
            <div className="bg-muted/60 flex min-w-0 flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="shrink-0 text-sm font-semibold">
                  WTED Radio Program Director
                </h1>
              </div>
            </div>
            <CardContent className="border-t border-border/40 bg-muted/20 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
              <div className="space-y-4">
                <p>{introP1}</p>
                <p>
                  Have an idea or want to contribute? Become a GORP (Goose Obsessed
                  Radio Personality) over at the{" "}
                  <Link
                    href={SHOWS_INTRO.communityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground hover:underline"
                  >
                    {SHOWS_INTRO.communityLabel}
                  </Link>{" "}
                  — the limits of WTED are driven only by the creativity of
                  listeners like you.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      }

      {isV2 ?
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
                        if (d) {
                          setShowInfo({
                            showTitle: showItem.show,
                            description: d,
                          })
                        }
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
      : <div className="mb-8 w-full min-w-0 space-y-3 pb-4">
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
                          if (d) {
                            setShowInfo({
                              showTitle: showItem.show,
                              description: d,
                            })
                          }
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
      }
    </div>
  )
}
