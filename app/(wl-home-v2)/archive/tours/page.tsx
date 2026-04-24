import { Suspense } from "react"
import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2ToursView } from "@/components/wl-home-v2/wl-home-v2-tours-view"

export const metadata: Metadata = {
  title: "Tours",
}

export default function ArchiveToursPage() {
  return (
    <Suspense
      fallback={
        <WlHomeV2>
          <WlHomeV2PageLoading message="Loading tour…" />
        </WlHomeV2>
      }
    >
      <WlHomeV2ToursView />
    </Suspense>
  )
}
