import type { Metadata } from "next"

import { WlHomeV2HelpView } from "@/components/help/wl-home-v2-help-view"

export const metadata: Metadata = {
  title: "Help",
  description:
    "Help and FAQ for WTEDRadio.com — sign in, home page, WTED Goose Radio, and WTED Archives.",
}

export default function HelpPage() {
  return <WlHomeV2HelpView />
}
