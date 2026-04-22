import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"

export const metadata: Metadata = {
  title: "Archives",
}

/** Full WTED homepage with the archive hub modal open (bookmarkable `/archive`). */
export default function ArchivesHubPage() {
  return <WlHomeV2 archiveModalInitiallyOpen />
}
