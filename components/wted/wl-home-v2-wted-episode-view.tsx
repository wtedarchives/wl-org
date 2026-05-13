"use client"

import { Suspense } from "react"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2WtedEpisodePageClient } from "@/components/wted/wl-home-v2-wted-episode-page-client"

export function WlHomeV2WtedEpisodeView() {
  return (
    <WlHomeV2>
      <Suspense
        fallback={<WlHomeV2PageLoading message="Loading episode…" />}
      >
        <WlHomeV2WtedEpisodePageClient />
      </Suspense>
    </WlHomeV2>
  )
}
