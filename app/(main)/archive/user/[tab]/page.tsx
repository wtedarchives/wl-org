import { Suspense } from "react"

import { PROFILE_STATS_TABS } from "@/components/dpro/profile/profile-stats-tab-config"
import { PublicProfileTabPageClient } from "./public-profile-tab-page-client"

export function generateStaticParams() {
  return PROFILE_STATS_TABS.map((t) => ({ tab: t.slug }))
}

export default function ArchiveUserTabPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        </div>
      }
    >
      <PublicProfileTabPageClient />
    </Suspense>
  )
}
