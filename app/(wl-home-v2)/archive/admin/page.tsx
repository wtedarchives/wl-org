import type { Metadata } from "next"

import { AdminPanel } from "@/components/dpro/admin/admin-panel"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2AdminGate } from "@/components/wl-home-v2/wl-home-v2-admin-gate"
import { WlHomeV2ArchiveAdminLayout } from "@/components/wl-home-v2/wl-home-v2-archive-admin-layout"

export const metadata: Metadata = {
  title: "Admin",
}

export default function ArchiveAdminPage() {
  return (
    <WlHomeV2>
      <WlHomeV2AdminGate>
        <WlHomeV2ArchiveAdminLayout>
          <AdminPanel />
        </WlHomeV2ArchiveAdminLayout>
      </WlHomeV2AdminGate>
    </WlHomeV2>
  )
}
