import type { Metadata } from "next"

import { AdminRadio } from "@/components/dpro/admin/admin-radio"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2AdminGate } from "@/components/wl-home-v2/wl-home-v2-admin-gate"
import { WlHomeV2ArchiveAdminLayout } from "@/components/wl-home-v2/wl-home-v2-archive-admin-layout"

export const metadata: Metadata = {
  title: "Radio (Admin)",
}

export default function ArchiveAdminRadioPage() {
  return (
    <WlHomeV2>
      <WlHomeV2AdminGate>
        <WlHomeV2ArchiveAdminLayout>
          <AdminRadio />
        </WlHomeV2ArchiveAdminLayout>
      </WlHomeV2AdminGate>
    </WlHomeV2>
  )
}
