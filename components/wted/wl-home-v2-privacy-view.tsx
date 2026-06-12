"use client"

import { WlHomeV2 } from "@/components/wl-home-v2"
import { WtedPrivacyWlHomeV2 } from "@/components/wted/wted-privacy-wl-home-v2"

export function WlHomeV2PrivacyView() {
  return (
    <WlHomeV2>
      <WtedPrivacyWlHomeV2 />
    </WlHomeV2>
  )
}
