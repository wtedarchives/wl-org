import { Suspense } from "react"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import SetlistArchivePageClient from "./setlist-archive-page-client"

export default function SetlistArchivePage() {
  return (
    <Suspense
      fallback={
        <LoadingPageCard message="Loading setlist…" page="setlist" />
      }
    >
      <SetlistArchivePageClient />
    </Suspense>
  )
}
