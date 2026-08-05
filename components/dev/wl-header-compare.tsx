"use client"

import { createElement, useEffect, useState } from "react"
import Script from "next/script"

import { WlHomeV2 } from "@/components/wl-home-v2"

import "./wl-header-compare.css"

/**
 * Side-by-side: in-app React header (`WlHomeV2`) vs Community `<wl-header>` embed.
 * Visit `/dev/header-compare` under `next dev` to exercise both search UIs.
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
          <span>WlHomeV2 — desktop field + mobile modal</span>
        </div>
        <div className="wl-header-compare__react-shell">
          <WlHomeV2>
            <div className="wl-header-compare__react-body">
              <p>
                Use the magnifying glass (mobile) or search field (wide
                desktop) in the header above. Results call the Edge function
                directly via the Next client.
              </p>
            </div>
          </WlHomeV2>
        </div>
      </section>

      <section className="wl-header-compare__section">
        <div className="wl-header-compare__label">
          External header (custom element)
          <span>
            /embed/wl-header.js
            {embedReady ? " · loaded" : " · loading…"}
            {" · proxy /api/site-search"}
          </span>
        </div>
        {createElement("wl-header")}
        <div className="wl-header-compare__embed-body">
          <p>
            Same Search control as Community. Fetches{" "}
            <code>/api/site-search</code> (same-origin proxy; no Supabase
            functions URL in the embed). On localhost the Next rewrite
            handles the proxy; production uses Netlify{" "}
            <code>_redirects</code>.
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
