import type { Metadata } from "next"

import { WlHomeV2GorpsView } from "@/components/wted/wl-home-v2-gorps-view"

export const metadata: Metadata = {
  title: "GORPs & Contributors",
  description:
    "Goose Obsessed Radio Personalities (GORPs) and station contributors at WTED Goose Radio.",
}

export default function WtedGorpsPage() {
  return <WlHomeV2GorpsView />
}
