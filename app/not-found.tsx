import type { Metadata } from "next"

import { NotFoundContent } from "@/components/not-found-content"
import { WlHomeV2 } from "@/components/wl-home-v2"

export const metadata: Metadata = {
  title: { absolute: "Page not found — WysteriaLane.org" },
}

export default function NotFound() {
  return (
    <WlHomeV2>
      <NotFoundContent />
    </WlHomeV2>
  )
}
