import { Suspense } from "react"
import type { Metadata } from "next"

import { WlHomeV2ShareCardPage } from "@/components/wl-home-v2/wl-home-v2-share-card-page"
import "@/components/wl-home-v2/wl-home-v2-share-card-page.css"

export const metadata: Metadata = {
  title: "Share card",
  robots: { index: false, follow: false },
}

export default function ArchiveShareCardPage() {
  return (
    <Suspense
      fallback={
        <div className="wl-home-v2-share-card-page">
          <p className="wl-home-v2-share-card-page__status">Loading setlist card…</p>
        </div>
      }
    >
      <WlHomeV2ShareCardPage />
    </Suspense>
  )
}
