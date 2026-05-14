import { Suspense } from "react"

import { WlHomeV2 } from "@/components/wl-home-v2"
import {
  WlHomeV2ArchiveProfileLayoutClient,
  WlHomeV2ArchiveProfileRouteSuspenseFallback,
} from "@/components/wl-home-v2/wl-home-v2-archive-profile-layout-client"

export default function ArchiveProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WlHomeV2>
      <Suspense fallback={<WlHomeV2ArchiveProfileRouteSuspenseFallback />}>
        <WlHomeV2ArchiveProfileLayoutClient />
      </Suspense>
      {children}
    </WlHomeV2>
  )
}
