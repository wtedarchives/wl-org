import type { Metadata } from "next"

import { WlHeaderCompare } from "@/components/dev/wl-header-compare"

export const metadata: Metadata = {
  title: "Header radio compare",
}

export default function HeaderComparePage() {
  return <WlHeaderCompare />
}
