import { Suspense } from "react"
import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"
import { WlHomeV2YearsView } from "@/components/wl-home-v2/wl-home-v2-years-view"

export const metadata: Metadata = {
  title: "Years",
}

export default function ArchiveYearsPage() {
  return (
    <Suspense
      fallback={
        <WlHomeV2>
          <WlHomeV2PageLoading message="Loading years…" />
        </WlHomeV2>
      }
    >
      <WlHomeV2YearsView />
    </Suspense>
  )
}
