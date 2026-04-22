import { Suspense } from "react"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"

import ListsArchivePageClient from "./lists-archive-page-client"

export const metadata = {
  title: "Lists",
}

export default function DproListsPage() {
  return (
    <Suspense fallback={<LoadingPageCard message="Loading lists…" />}>
      <ListsArchivePageClient />
    </Suspense>
  )
}
