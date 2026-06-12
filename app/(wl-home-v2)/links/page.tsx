import type { Metadata } from "next"

import { WlHomeV2LinksView } from "@/components/wted/wl-home-v2-links-view"

export const metadata: Metadata = {
  title: "Links",
}

export default function LinksPage() {
  return <WlHomeV2LinksView />
}
