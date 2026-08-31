import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2EchoRootView } from "@/components/wl-home-v2/wl-home-v2-echo-root-view"

export const metadata: Metadata = {
  title: "Echo of a Show",
}

export default function ArchiveEchoPage() {
  return (
    <WlHomeV2>
      <WlHomeV2EchoRootView />
    </WlHomeV2>
  )
}
