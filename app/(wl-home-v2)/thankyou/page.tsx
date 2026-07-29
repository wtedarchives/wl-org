import type { Metadata } from "next"

import { WlHomeV2ThankyouView } from "@/components/wted/wl-home-v2-thankyou-view"

export const metadata: Metadata = {
  title: "Thank You",
}

export default function ThankyouPage() {
  return <WlHomeV2ThankyouView />
}
