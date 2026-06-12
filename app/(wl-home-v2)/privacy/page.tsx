import type { Metadata } from "next"

import { WlHomeV2PrivacyView } from "@/components/wted/wl-home-v2-privacy-view"

export const metadata: Metadata = {
  title: "Privacy",
}

export default function PrivacyPage() {
  return <WlHomeV2PrivacyView />
}
