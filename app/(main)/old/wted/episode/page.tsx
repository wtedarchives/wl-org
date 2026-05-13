import type { Metadata } from "next"
import { Suspense } from "react"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { WtedEpisodePageClientLegacy } from "@/components/wted/wted-episode-page-client-legacy"

export const metadata: Metadata = {
  title: "Episode",
  description: "WTED Radio episode track listing (previous layout).",
}

export default function OldWtedEpisodePage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <Suspense
          fallback={<LoadingPageCard message="Loading episode…" />}
        >
          <WtedEpisodePageClientLegacy />
        </Suspense>
      </div>
    </div>
  )
}
