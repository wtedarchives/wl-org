import { Suspense } from "react"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"

import ToursArchivePageClient from "./tours-archive-page-client"

export default function DproToursPage() {
  return (
    <Suspense
      fallback={<LoadingPageCard message="Loading tour…" page="tour" />}
    >
      <ToursArchivePageClient />
    </Suspense>
  )
}
