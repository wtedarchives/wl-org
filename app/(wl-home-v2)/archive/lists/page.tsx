import type { Metadata } from "next"
import { Suspense } from "react"

import { WlHomeV2ListsArchiveRouteClient } from "@/components/archive-lists/wl-home-v2-lists-archive-route-client"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

export const metadata: Metadata = {
  title: "Lists",
}

export default function ArchiveListsPage() {
  return (
    <WlHomeV2>
      <Suspense
        fallback={<WlHomeV2PageLoading message="Loading lists…" />}
      >
        <WlHomeV2ListsArchiveRouteClient />
      </Suspense>
    </WlHomeV2>
  )
}
