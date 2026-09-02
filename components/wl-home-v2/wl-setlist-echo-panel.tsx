"use client"

import { Trophy } from "@phosphor-icons/react"
import type { CSSProperties } from "react"

import { ArchivePrefetchLink } from "@/components/archive/archive-prefetch-link"
import { useSetlistEchoShowWinner } from "@/hooks/use-setlist-echo-show-winner"
import { getEchoLiveShowUrl } from "@/lib/echo-archive-url"
import type { Show } from "@/types/setlist"
import { cn } from "@/lib/utils"

import "./wl-setlist-echo-panel.css"

export function WlSetlistEchoPanel({
  showId,
  show,
}: {
  showId: string
  show: Pick<Show, "show_issetlistgame" | "show_scored">
}) {
  if (!show.show_issetlistgame) return null

  return (
    <WlSetlistEchoPanelLoaded
      showId={showId}
      scored={Boolean(show.show_scored)}
    />
  )
}

function WlSetlistEchoPanelLoaded({
  showId,
  scored,
}: {
  showId: string
  scored: boolean
}) {
  const { winnerLabel, loading } = useSetlistEchoShowWinner(showId, scored)
  const echoHref = getEchoLiveShowUrl(showId)

  return (
    <ArchivePrefetchLink
      href={echoHref}
      prefetchArchive={false}
      className="wl-setlist-echo-panel__link"
      aria-label={
        scored && winnerLabel ?
          `Echo of a Show winner ${winnerLabel}`
        : "Play Echo of a Show"
      }
    >
      <section
        className={cn(
          "wl-home-v2-years-tile wl-setlist-echo-panel",
          !scored && "wl-setlist-echo-panel--play",
        )}
        style={
          {
            "--tile-bg": "url('/newbg.png')",
          } as CSSProperties
        }
      >
        <div className="wl-home-v2-years-tile-inner">
          <div className="side-card wl-setlist-echo-panel__side-card">
            {scored ?
              <div className="wl-setlist-echo-panel__scored">
                <div className="wl-setlist-echo-panel__title-row">
                  <Trophy
                    className="wl-setlist-echo-panel__icon wl-setlist-echo-panel__icon--accent"
                    weight="regular"
                    aria-hidden
                  />
                  <span className="wl-setlist-echo-panel__header-title">
                    Echo of a Show Winner
                  </span>
                </div>
                {loading ?
                  <span className="wl-setlist-echo-panel__winner-pill">…</span>
                : winnerLabel ?
                  <span className="wl-setlist-echo-panel__winner-pill">
                    {winnerLabel}
                  </span>
                : null}
              </div>
            : <div className="wl-setlist-echo-panel__cta">
                <Trophy
                  className="wl-setlist-echo-panel__icon wl-setlist-echo-panel__icon--accent"
                  weight="regular"
                  aria-hidden
                />
                <span>Play Echo of a Show</span>
              </div>
            }
          </div>
        </div>
      </section>
    </ArchivePrefetchLink>
  )
}

export function isWlSetlistEchoPanelVisible(
  show: Pick<Show, "show_issetlistgame"> | null | undefined,
): boolean {
  return Boolean(show?.show_issetlistgame)
}
