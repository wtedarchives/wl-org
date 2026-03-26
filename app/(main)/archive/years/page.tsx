import { Suspense } from "react"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"

import YearsArchivePageClient from "./years-archive-page-client"

export default function DproYearsPage() {
  return (
    <Suspense
      fallback={
        <LoadingPageCard message="Loading years…" page="years" />
      }
    >
      <YearsArchivePageClient />
    </Suspense>
  )
}
