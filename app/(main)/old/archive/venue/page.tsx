import { Suspense } from "react"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"

import VenueArchivePageClient from "./venue-archive-page-client"

export const metadata = {
  title: "Venue",
}

export default function VenueArchivePage() {
  return (
    <Suspense
      fallback={<LoadingPageCard message="Loading venue…" page="venue" />}
    >
      <VenueArchivePageClient />
    </Suspense>
  )
}
