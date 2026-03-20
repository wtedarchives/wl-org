import { Suspense } from "react"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { SetlistGameContent } from "@/components/dpro/setlistgame/setlist-game-content"

export const metadata = {
  title: "Setlist Game – Wysteria Lane",
}

export default function SetlistGamePage() {
  return (
    <Suspense fallback={<LoadingPageCard message="Loading setlist game…" />}>
      <SetlistGameContent />
    </Suspense>
  )
}
