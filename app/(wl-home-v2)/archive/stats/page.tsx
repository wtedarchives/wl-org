import { Suspense } from "react"
import type { Metadata } from "next"

import { WlHomeV2StatsArchiveView } from "@/components/archive-stats/wl-home-v2-stats-archive-view"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

export const metadata: Metadata = {
  title: "Stats",
}

export default function ArchiveStatsPage() {
  return (
    <WlHomeV2>
      <Suspense
        fallback={<WlHomeV2PageLoading message="Loading stats data…" />}
      >
        <WlHomeV2StatsArchiveView />
      </Suspense>
    </WlHomeV2>
  )
}
