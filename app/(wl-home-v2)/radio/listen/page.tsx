import type { Metadata } from "next"

import { WlHomeV2ListenView } from "@/components/wted/wl-home-v2-listen-view"

export const metadata: Metadata = {
  title: "Now Playing",
}

export default function RadioListenPage() {
  return <WlHomeV2ListenView />
}
