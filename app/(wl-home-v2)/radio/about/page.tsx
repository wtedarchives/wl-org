import type { Metadata } from "next"

import { WlHomeV2AboutView } from "@/components/wted/wl-home-v2-about-view"

export const metadata: Metadata = {
  title: "About Us and FAQ",
}

export default function WtedAboutPage() {
  return <WlHomeV2AboutView />
}
