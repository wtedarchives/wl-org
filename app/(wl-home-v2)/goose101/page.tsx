import type { Metadata } from "next"

import { WlHomeV2Goose101View } from "@/components/goose101/wl-home-v2-goose101-view"

export const metadata: Metadata = {
  title: "Goose 101",
}

export default function Goose101Page() {
  return <WlHomeV2Goose101View />
}
