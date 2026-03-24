import { Suspense } from "react"
import { DiscographyContent } from "@/components/dpro/discography/discography-content"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"

export const metadata = {
  title: "Discography – WysteriaLane.org",
}

export default function DiscographyPage() {
  return (
    <Suspense
      fallback={
        <LoadingPageCard message="Loading discography data…" />
      }
    >
      <DiscographyContent />
    </Suspense>
  )
}
