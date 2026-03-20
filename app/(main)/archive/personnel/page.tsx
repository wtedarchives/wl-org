import { Suspense } from "react"
import { PersonnelContent } from "@/components/dpro/personnel/personnel-content"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"

export const metadata = {
  title: "Personnel – Wysteria Lane",
}

export default function DproPersonnelPage() {
  return (
    <Suspense fallback={<LoadingPageCard message="Loading personnel data…" />}>
      <PersonnelContent />
    </Suspense>
  )
}
