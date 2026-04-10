import { Suspense } from "react"
import type { Metadata } from "next"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { WtedEpisodePageClient } from "@/components/wted/wted-episode-page-client"

export const metadata: Metadata = {
  title: "WTED Radio – Episode – WysteriaLane.org",
  description: "WTED Radio episode track listing.",
}

export default function WtedEpisodePage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <Suspense
          fallback={<LoadingPageCard message="Loading episode…" />}
        >
          <WtedEpisodePageClient />
        </Suspense>
      </div>
    </div>
  )
}
