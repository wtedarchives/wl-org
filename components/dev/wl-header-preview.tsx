"use client"

import { createElement, useEffect, useState } from "react"
import Script from "next/script"

import "./wl-header-preview.css"

/**
 * Dev preview for the Community `<wl-header>` embed (`public/embed/wl-header.js`).
 *
 * For React header + embed side-by-side (including search), use
 * `/dev/header-compare` (`WlHeaderCompare`).
 */
export function WlHeaderPreview() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof customElements !== "undefined" && customElements.get("wl-header")) {
      setReady(true)
    }
  }, [])

  return (
    <div className="wl-header-preview">
      <div className="wl-header-preview__label">
        Embed preview
        <span>
          /embed/wl-header.js
          {ready ? " · loaded" : " · loading…"}
        </span>
      </div>

      {createElement("wl-header")}

      <div className="wl-header-preview__body">
        <h1>Dummy host page</h1>
        <p>
          Resize for mobile vs desktop. This page only mounts the Community
          header custom element — it is not the in-app React header.
        </p>
      </div>

      <Script
        src="/embed/wl-header.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
    </div>
  )
}
