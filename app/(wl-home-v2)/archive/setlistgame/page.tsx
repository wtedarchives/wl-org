import { Suspense } from "react"
import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2SetlistGameView } from "@/components/wl-home-v2/wl-home-v2-setlistgame-view"

export const metadata: Metadata = {
  title: "Setlist Game",
}

export default function ArchiveSetlistGamePage() {
  return (
    <WlHomeV2>
      <Suspense
        fallback={
          <WlHomeV2PageLoading message="Loading setlist game…" />
        }
      >
        <WlHomeV2SetlistGameView />
      </Suspense>
    </WlHomeV2>
  )
}
