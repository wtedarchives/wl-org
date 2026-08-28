import type { Metadata } from "next"

import { TrmnlPreview } from "@/components/dev/trmnl-preview"

export const metadata: Metadata = {
  title: "TRMNL feed preview",
}

export default function TrmnlPreviewPage() {
  return <TrmnlPreview />
}
