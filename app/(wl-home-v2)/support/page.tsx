import type { Metadata } from "next"

import { WlHomeV2SupportView } from "@/components/wted/wl-home-v2-support-view"

export const metadata: Metadata = {
  title: "Support",
}

export default function SupportPage() {
  return <WlHomeV2SupportView />
}
