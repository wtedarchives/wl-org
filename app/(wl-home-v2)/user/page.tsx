import { Suspense } from "react"
import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2ArchiveUserPageClient } from "@/components/wl-home-v2/wl-home-v2-archive-user-page-client"
import { WlHomeV2ProfileArchiveSuspenseFallback } from "@/components/wl-home-v2/wl-home-v2-profile-archive-shell"

export const metadata: Metadata = {
  title: "Profile",
}

export default function PublicUserProfilePage() {
  return (
    <WlHomeV2>
      <Suspense
        fallback={
          <WlHomeV2ProfileArchiveSuspenseFallback message="Loading profile…" />
        }
      >
        <WlHomeV2ArchiveUserPageClient />
      </Suspense>
    </WlHomeV2>
  )
}
