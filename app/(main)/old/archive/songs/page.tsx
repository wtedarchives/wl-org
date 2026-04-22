import { Suspense } from "react"
import { SongsContent } from "@/components/dpro/songs/songs-content"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"

export const metadata = {
  title: "Songs",
}

export default function DproSongsPage() {
  return (
    <Suspense fallback={<LoadingPageCard message="Loading songs data…" />}>
      <SongsContent />
    </Suspense>
  )
}
