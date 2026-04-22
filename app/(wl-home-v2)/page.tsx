import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"

export const metadata: Metadata = {
  title: { absolute: "WTED.org" },
}

export default function Page() {
  return <WlHomeV2 />
}
