import type { Metadata } from "next"

import { IosRadioEmbed } from "@/components/wted/ios-radio/ios-radio-embed"

export const metadata: Metadata = {
  title: { absolute: "WTED Radio" },
  robots: { index: false, follow: false },
}

export default function EmbedRadioPage() {
  return <IosRadioEmbed />
}
