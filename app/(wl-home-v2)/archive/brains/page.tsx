import type { Metadata } from "next"

import { BrainsGate } from "@/components/brains/brains-gate"
import { BrainsShell } from "@/components/brains/brains-shell"
import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2ArchiveAdminLayout } from "@/components/wl-home-v2/wl-home-v2-archive-admin-layout"

/** Root layout appends " – WTEDRadio.com". */
export const metadata: Metadata = {
  title: "WTED-Brains",
}

export default function ArchiveBrainsPage() {
  return (
    <WlHomeV2>
      <BrainsGate>
        <WlHomeV2ArchiveAdminLayout>
          <BrainsShell>
            {/* Setlist, dictionary adds and coach's notes land here. */}
          </BrainsShell>
        </WlHomeV2ArchiveAdminLayout>
      </BrainsGate>
    </WlHomeV2>
  )
}
