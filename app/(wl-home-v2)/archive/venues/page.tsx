import { Suspense } from "react"
import type { Metadata } from "next"

import { WlHomeV2VenuesArchiveView } from "@/components/archive-venues/wl-home-v2-venues-archive-view"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

export const metadata: Metadata = {
  title: "Venues",
}

export default function ArchiveVenuesPage() {
  return (
    <WlHomeV2>
      <Suspense
        fallback={<WlHomeV2PageLoading message="Loading venues…" />}
      >
        <WlHomeV2VenuesArchiveView />
      </Suspense>
    </WlHomeV2>
  )
}
