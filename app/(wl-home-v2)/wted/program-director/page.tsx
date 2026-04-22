import type { Metadata } from "next"

import { WlHomeV2ProgramDirectorView } from "@/components/wted/wl-home-v2-program-director-view"

export const metadata: Metadata = {
  title: "Program Director",
  description:
    "WTED Radio shows and episodes with links to published track listings.",
}

export default function WtedProgramDirectorPage() {
  return <WlHomeV2ProgramDirectorView />
}
