import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"
import { WlHomeV2SetlistGameRootView } from "@/components/wl-home-v2/wl-home-v2-setlistgame-root-view"

export const metadata: Metadata = {
  title: "Setlist Game",
}

export default function ArchiveSetlistGamePage() {
  return (
    <WlHomeV2>
      <WlHomeV2SetlistGameRootView />
    </WlHomeV2>
  )
}
