import { Suspense } from "react"
import { VenuesContent } from "@/components/dpro/venues/venues-content"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"

export const metadata = {
  title: "Venues – Wysteria Lane",
}

export default function DproVenuesPage() {
  return (
    <Suspense fallback={<LoadingPageCard message="Loading venues…" />}>
      <VenuesContent />
    </Suspense>
  )
}
