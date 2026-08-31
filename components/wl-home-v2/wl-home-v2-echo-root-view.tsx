"use client"

import { EchoTourView } from "@/components/echo/echo-tour-view"
import "@/components/dpro/setlistgame/setlist-game-wl-v2.css"

export function WlHomeV2EchoRootView() {
  return (
    <div className="wl-home-v2-years-page wl-home-v2-setlist">
      <div className="wl-home-v2-years-body">
        <div className="wl-home-v2-years-columns">
          <section className="wl-home-v2-years-tile wl-home-v2-years-tile--main wl-home-v2-setlistgame-tile-main">
            <EchoTourView />
          </section>
        </div>
      </div>
    </div>
  )
}
