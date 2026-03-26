import { Suspense } from "react"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"

import PersonnelArchivePageClient from "./personnel-archive-page-client"

export const metadata = {
  title: "Personnel – WysteriaLane.org",
}

export default function DproPersonnelPage() {
  return (
    <Suspense
      fallback={
        <LoadingPageCard message="Loading personnel…" page="personnel" />
      }
    >
      <PersonnelArchivePageClient />
    </Suspense>
  )
}
