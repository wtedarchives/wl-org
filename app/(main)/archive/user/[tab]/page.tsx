import { Suspense } from "react"

import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { PROFILE_STATS_TABS } from "@/components/dpro/profile/profile-stats-tab-config"
import { PublicProfileTabPageClient } from "./public-profile-tab-page-client"

export function generateStaticParams() {
  return PROFILE_STATS_TABS.map((t) => ({ tab: t.slug }))
}

export default function ArchiveUserTabPage() {
  return (
    <Suspense fallback={<LoadingPageCard message="Loading profile…" />}>
      <PublicProfileTabPageClient />
    </Suspense>
  )
}
