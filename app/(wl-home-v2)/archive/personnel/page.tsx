import { Suspense } from "react"
import type { Metadata } from "next"

import { WlHomeV2PersonnelArchiveView } from "@/components/archive-personnel/wl-home-v2-personnel-archive-view"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

export const metadata: Metadata = {
  title: "Personnel",
}

export default function ArchivePersonnelPage() {
  return (
    <WlHomeV2>
      <Suspense
        fallback={<WlHomeV2PageLoading message="Loading personnel…" />}
      >
        <WlHomeV2PersonnelArchiveView />
      </Suspense>
    </WlHomeV2>
  )
}
