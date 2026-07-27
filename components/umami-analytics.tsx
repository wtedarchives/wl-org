"use client"

import { useEffect } from "react"

const UMAMI_SRC = "https://cloud.umami.is/script.js"
const UMAMI_WEBSITE_ID = "df551c73-5e95-469e-97eb-6db7c82e6e14"

const PRODUCTION_HOSTS = new Set(["wtedradio.com", "www.wtedradio.com"])

/**
 * Loads Umami only on production hostnames so Netlify previews / localhost
 * do not pollute analytics before (or after) DNS cutover.
 */
export function UmamiAnalytics() {
  useEffect(() => {
    if (!PRODUCTION_HOSTS.has(window.location.hostname)) return
    if (document.querySelector(`script[src="${UMAMI_SRC}"]`)) return

    const script = document.createElement("script")
    script.src = UMAMI_SRC
    script.defer = true
    script.dataset.websiteId = UMAMI_WEBSITE_ID
    document.head.appendChild(script)
  }, [])

  return null
}
