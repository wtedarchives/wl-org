import { Suspense } from "react"
import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2SetlistPageClient } from "@/components/wl-home-v2/wl-home-v2-setlist-page-client"

/** Plain fallback until `useSetlistArchiveDocumentTitle` runs with `WTEDRadio.com` suffix. */
export const metadata: Metadata = {
  title: { absolute: "Setlist – WTEDRadio.com" },
}

export default function ArchiveSetlistPage() {
  return (
    <WlHomeV2>
      {/* Inner Suspense avoids remounting the shell when `useSearchParams` suspends (radio embed). */}
      <Suspense fallback={<WlHomeV2PageLoading message="Loading setlist…" />}>
        <WlHomeV2SetlistPageClient />
      </Suspense>
    </WlHomeV2>
  )
}
