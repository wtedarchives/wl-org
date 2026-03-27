import { Suspense } from "react"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"

import ArchiveUserPageClient from "./archive-user-page-client"

export const metadata = {
  title: "User – WysteriaLane.org",
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<LoadingPageCard message="Loading profile…" />}>
      <ArchiveUserPageClient />
    </Suspense>
  )
}
