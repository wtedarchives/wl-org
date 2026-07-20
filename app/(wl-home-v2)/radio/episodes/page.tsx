import type { Metadata } from "next"

import { WlHomeV2ProgramDirectorView } from "@/components/wted/wl-home-v2-program-director-view"

export const metadata: Metadata = {
  title: "Shows",
  description:
    "WTED Radio shows and episodes with links to published track listings.",
}

export default function WtedEpisodesPage() {
  return <WlHomeV2ProgramDirectorView />
}
