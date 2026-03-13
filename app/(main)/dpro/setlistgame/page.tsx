import { Suspense } from "react"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { SetlistGameContent } from "@/components/dpro/setlistgame/setlist-game-content"

export const metadata = {
  title: "Echo of a Show – WTED.org",
}

export default function SetlistGamePage() {
  return (
    <Suspense fallback={<LoadingPageCard message="Loading setlist game…" />}>
      <SetlistGameContent />
    </Suspense>
  )
}
