import type { Metadata } from "next"

import { WlHomeV2 } from "@/components/wl-home-v2"

export const metadata: Metadata = {
  title: "Home",
}

export default function Page() {
  return <WlHomeV2 />
}
