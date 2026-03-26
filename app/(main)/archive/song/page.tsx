import { Suspense } from "react"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"

import SongArchivePageClient from "./song-archive-page-client"

export default function SongArchivePage() {
  return (
    <Suspense
      fallback={
        <LoadingPageCard message="Loading song…" page="song" />
      }
    >
      <SongArchivePageClient />
    </Suspense>
  )
}
