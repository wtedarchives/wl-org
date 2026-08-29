"use client"

import { WL_V2_ARCHIVES_BREADCRUMB_ROOT } from "@/components/setlist-breadcrumb-context"
import {
  WlHomeV2ArchiveCrumbsShell,
  WlHomeV2ArchiveCrumbsTrail,
} from "@/components/wl-home-v2/wl-home-v2-archive-crumbs"
import { useWlHomeV2OpenArchiveHub } from "@/components/wl-home-v2/wl-home-v2-open-archive-hub-context"

const SETLIST_GAME_ROOT_BREADCRUMBS = [
  WL_V2_ARCHIVES_BREADCRUMB_ROOT,
  { label: "Setlist Game", href: "/archive/setlistgame" },
]

/** Blank canvas at `/archive/setlistgame` while the page is reinvented. */
export function WlHomeV2SetlistGameRootView() {
  const openArchiveHub = useWlHomeV2OpenArchiveHub()

  return (
    <div className="wl-home-v2-years-page">
      <WlHomeV2ArchiveCrumbsShell
        variant="rail"
        bottomSpacing={false}
        trail={
          <WlHomeV2ArchiveCrumbsTrail
            items={SETLIST_GAME_ROOT_BREADCRUMBS}
            openArchiveHub={openArchiveHub ?? undefined}
          />
        }
      />
      <div className="wl-home-v2-years-body">
        <div className="wl-home-v2-years-columns">
          <section className="wl-home-v2-years-tile wl-home-v2-years-tile--main">
            <div className="wl-home-v2-years-tile-inner" />
          </section>
        </div>
      </div>
    </div>
  )
}
