import { Suspense } from "react"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"

import SetlistGameArchivePageClient from "./setlistgame-archive-page-client"

export const metadata = {
  title: "Setlist Game",
}

export default function OldArchiveSetlistGamePage() {
  return (
    <Suspense fallback={<LoadingPageCard message="Loading setlist game…" />}>
      <SetlistGameArchivePageClient />
    </Suspense>
  )
}
