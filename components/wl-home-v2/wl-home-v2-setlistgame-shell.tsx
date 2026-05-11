"use client"

import type { CSSProperties, ReactNode } from "react"

/**
 * Same main-column chrome as {@link WlHomeV2TourPageBody} so Setlist Game
 * reads as part of the v2 archive tour/year family.
 */
export function WlHomeV2SetlistGameShell({ children }: { children: ReactNode }) {
  return (
    <div className="wl-home-v2-years-page">
      <div className="wl-home-v2-years-body">
        <div className="wl-home-v2-years-columns">
          <section
            className="wl-home-v2-years-tile wl-home-v2-years-tile--main"
            style={
              {
                "--tile-bg": "url('/newbg3.jpeg')",
              } as CSSProperties
            }
          >
            <div className="wl-home-v2-years-tile-inner wl-home-v2-tour-page-main min-h-0 flex flex-1 flex-col gap-4">
              {children}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
