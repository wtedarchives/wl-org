import type { Metadata } from "next"

import { BrainsCoachNotesSection } from "@/components/brains/brains-coach-notes-section"
import { BrainsDictionarySection } from "@/components/brains/brains-dictionary-section"
import { BrainsGate } from "@/components/brains/brains-gate"
import { BrainsOptionsProvider } from "@/components/brains/brains-options-context"
import { BrainsSetlistSection } from "@/components/brains/brains-setlist-section"
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
          <BrainsOptionsProvider>
            <BrainsShell>
              <BrainsSetlistSection />
              <BrainsCoachNotesSection />
              <BrainsDictionarySection />
            </BrainsShell>
          </BrainsOptionsProvider>
        </WlHomeV2ArchiveAdminLayout>
      </BrainsGate>
    </WlHomeV2>
  )
}
