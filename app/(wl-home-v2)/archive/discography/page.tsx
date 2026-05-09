import type { Metadata } from "next"
import { Suspense } from "react"

import { WlHomeV2DiscographyArchiveRouteClient } from "@/components/archive-discography/wl-home-v2-discography-archive-route-client"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

export const metadata: Metadata = {
  title: "Discography",
}

export default function ArchiveDiscographyPage() {
  return (
    <WlHomeV2>
      <Suspense
        fallback={<WlHomeV2PageLoading message="Loading discography…" />}
      >
        <WlHomeV2DiscographyArchiveRouteClient />
      </Suspense>
    </WlHomeV2>
  )
}
