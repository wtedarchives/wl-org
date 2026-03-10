import { Suspense } from "react"
import { ListsContent } from "@/components/dpro/lists/lists-content"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"

export const metadata = {
  title: "Lists – Wysteria Lane",
}

export default function DproListsPage() {
  return (
    <Suspense fallback={<LoadingPageCard message="Loading lists…" />}>
      <ListsContent />
    </Suspense>
  )
}
