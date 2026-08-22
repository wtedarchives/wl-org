"use client"

import { createElement, useEffect, useState } from "react"
import Script from "next/script"

import { WlHomeV2 } from "@/components/wl-home-v2"

import "./wl-header-compare.css"

/**
 * Side-by-side: in-app React header (`WlHomeV2`) vs Community `<wl-header>` embed.
 * Visit `/dev/header-compare` to compare the header radio player on this site
 * with the iframe player Community will show.
 */
export function WlHeaderCompare() {
  const [embedReady, setEmbedReady] = useState(false)

  useEffect(() => {
    if (
      typeof customElements !== "undefined" &&
      customElements.get("wl-header")
    ) {
      setEmbedReady(true)
    }
  }, [])

  return (
    <div className="wl-header-compare">
      <section className="wl-header-compare__section">
        <div className="wl-header-compare__label">
          Site header (React)
          <span>This site — IosRadioBar mounted in-app</span>
        </div>
        <div className="wl-header-compare__react-shell">
          <WlHomeV2>
            <div className="wl-header-compare__react-body">
              <p>
                Same header as wtedradio.com. Play/stop and volume stay in this
                tab. Title/copy opens the matched setlist in this tab.
              </p>
            </div>
          </WlHomeV2>
        </div>
      </section>

      <section className="wl-header-compare__section">
        <div className="wl-header-compare__label">
          Community header (custom element)
          <span>
            /embed/wl-header.js iframes /embed/radio
            {embedReady ? " · loaded" : " · loading…"}
          </span>
        </div>
        {createElement("wl-header")}
        <div className="wl-header-compare__embed-body">
          <p>
            This is the header Discourse will render. The bar is the same
            React player, loaded in an iframe. Title/copy opens the setlist in
            a new window. The two players are independent — avoid playing both
            at once.
          </p>
        </div>
        <Script
          src="/embed/wl-header.js"
          strategy="afterInteractive"
          onLoad={() => setEmbedReady(true)}
        />
      </section>
    </div>
  )
}
