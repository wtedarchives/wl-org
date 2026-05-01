import type { Metadata } from "next"
import { Suspense } from "react"

import { WlHomeV2SongArchiveDetailRouteClient } from "@/components/archive-song/wl-home-v2-song-archive-detail-route-client"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2PageLoading } from "@/components/wl-home-v2/wl-home-v2-page-loading"

export const metadata: Metadata = {
  title: "Song",
}

export default function ArchiveSongPage() {
  return (
    <WlHomeV2>
      <Suspense fallback={<WlHomeV2PageLoading message="Loading song…" />}>
        <WlHomeV2SongArchiveDetailRouteClient />
      </Suspense>
    </WlHomeV2>
  )
}
