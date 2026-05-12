"use client"

import type { ReactNode } from "react"

import { SetlistGameWlV2ChromeProvider } from "@/components/dpro/setlistgame/setlist-game-wl-v2-chrome"
import "@/components/dpro/setlistgame/setlist-game-wl-v2.css"

/**
 * Same main-column chrome as {@link WlHomeV2TourPageBody} so Setlist Game
 * reads as part of the v2 archive tour/year family. `wl-home-v2-setlist`
 * scopes setlist-style `.show-header` frost (matches archive setlist page).
 *
 * `crumbs` render above the years body (same document order as
 * {@link WlHomeV2SetlistPlaceholderCrumbsBar} on `/archive/setlist`) so the
 * rail sits on the page gradient, not on the blurred tile.
 */
export function WlHomeV2SetlistGameShell({
  children,
  crumbs,
}: {
  children: ReactNode
  crumbs?: ReactNode
}) {
  return (
    <SetlistGameWlV2ChromeProvider>
      <div className="wl-home-v2-years-page wl-home-v2-setlist">
        {crumbs}
        <div className="wl-home-v2-years-body">
          <div className="wl-home-v2-years-columns">
            <section className="wl-home-v2-years-tile wl-home-v2-years-tile--main wl-home-v2-setlistgame-tile-main">
              <div className="wl-home-v2-years-tile-inner wl-home-v2-tour-page-main setlist-game-wl-v2-main-stack min-h-0">
                {children}
              </div>
            </section>
          </div>
        </div>
      </div>
    </SetlistGameWlV2ChromeProvider>
  )
}
