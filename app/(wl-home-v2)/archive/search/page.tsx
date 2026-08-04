import { Suspense } from "react"
import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2SiteSearchArchiveView } from "@/components/wl-home-v2/wl-home-v2-site-search-archive-view"

export const metadata: Metadata = {
  title: "Search",
}

export default function ArchiveSearchPage() {
  return (
    <WlHomeV2>
      <Suspense
        fallback={<WlHomeV2PageLoading message="Loading search results…" />}
      >
        <WlHomeV2SiteSearchArchiveView />
      </Suspense>
    </WlHomeV2>
  )
}
