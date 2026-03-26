import { Suspense } from "react"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"

import DiscographyArchivePageClient from "./discography-archive-page-client"

export const metadata = {
  title: "Discography – WysteriaLane.org",
}

export default function DiscographyPage() {
  return (
    <Suspense
      fallback={
        <LoadingPageCard message="Loading discography…" page="discography" />
      }
    >
      <DiscographyArchivePageClient />
    </Suspense>
  )
}
