import type { Metadata } from "next"

import { WlHomeV2AboutView } from "@/components/wted/wl-home-v2-about-view"

export const metadata: Metadata = {
  title: "About Us and FAQ",
}

/** `/radio` index — same content as `/radio/about` (legacy `/wted` landed on About). */
export default function RadioIndexPage() {
  return <WlHomeV2AboutView />
}
