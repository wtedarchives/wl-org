import { Suspense } from "react"
import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2EchoRootView } from "@/components/wl-home-v2/wl-home-v2-echo-root-view"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

export const metadata: Metadata = {
  title: "Echo of a Show",
}

export default function ArchiveEchoPage() {
  return (
    <WlHomeV2>
      <Suspense fallback={<WlHomeV2PageLoading message="Loading Echo of a Show…" />}>
        <WlHomeV2EchoRootView />
      </Suspense>
    </WlHomeV2>
  )
}

