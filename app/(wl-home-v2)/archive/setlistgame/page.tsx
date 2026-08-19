import { Suspense } from "react"
import type { Metadata } from "next"

import { EchoOfAShowView } from "@/components/echo-of-a-show/echo-of-a-show-view"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

export const metadata: Metadata = {
  title: "Echo of a Show",
}

export default function ArchiveEchoOfAShowPage() {
  return (
    <WlHomeV2>
      <Suspense
        fallback={
          <WlHomeV2PageLoading message="Loading Echo of a Show…" />
        }
      >
        <EchoOfAShowView />
      </Suspense>
    </WlHomeV2>
  )
}
