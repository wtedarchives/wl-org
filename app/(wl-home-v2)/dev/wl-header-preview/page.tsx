import type { Metadata } from "next"

import { WlHeaderPreview } from "@/components/dev/wl-header-preview"

export const metadata: Metadata = {
  title: "Header embed preview",
}

export default function WlHeaderPreviewPage() {
  return <WlHeaderPreview />
}
