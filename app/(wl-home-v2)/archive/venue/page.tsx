import type { Metadata } from "next"
import { Suspense } from "react"

import { WlHomeV2VenueArchiveDetailRouteClient } from "@/components/archive-venue/wl-home-v2-venue-archive-detail-route-client"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

export const metadata: Metadata = {
  title: "Venue",
}

export default function ArchiveVenuePage() {
  return (
    <WlHomeV2>
      <Suspense fallback={<WlHomeV2PageLoading message="Loading venue…" />}>
        <WlHomeV2VenueArchiveDetailRouteClient />
      </Suspense>
    </WlHomeV2>
  )
}
