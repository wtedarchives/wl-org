import type { Metadata } from "next"

import { Bugs } from "@/components/dpro/admin/bugs"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2AdminGate } from "@/components/wl-home-v2/wl-home-v2-admin-gate"
import { WlHomeV2ArchiveAdminLayout } from "@/components/wl-home-v2/wl-home-v2-archive-admin-layout"

export const metadata: Metadata = {
  title: "Bugs",
}

export default function ArchiveBugsPage() {
  return (
    <WlHomeV2>
      <WlHomeV2AdminGate>
        <WlHomeV2ArchiveAdminLayout>
          <Bugs />
        </WlHomeV2ArchiveAdminLayout>
      </WlHomeV2AdminGate>
    </WlHomeV2>
  )
}
