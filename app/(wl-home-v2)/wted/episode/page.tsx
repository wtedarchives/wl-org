import type { Metadata } from "next"

import { WlHomeV2WtedEpisodeView } from "@/components/wted/wl-home-v2-wted-episode-view"

export const metadata: Metadata = {
  title: "Episode",
  description: "WTED Radio episode track listing.",
}

export default function WtedEpisodePage() {
  return <WlHomeV2WtedEpisodeView />
}
