import { Suspense } from "react"
import type { Metadata } from "next"

import { WlHomeV2SongsArchiveView } from "@/components/archive-songs/wl-home-v2-songs-archive-view"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

export const metadata: Metadata = {
  title: "Songs",
}

export default function ArchiveSongsPage() {
  return (
    <WlHomeV2>
      <Suspense fallback={<WlHomeV2PageLoading message="Loading songs…" />}>
        <WlHomeV2SongsArchiveView />
      </Suspense>
    </WlHomeV2>
  )
}
