import type { Metadata } from "next"

import { ArchiveSubmitClient } from "./archive-submit-client"

export const metadata: Metadata = {
  title: "Submit",
}

export default function ArchiveSubmitPage() {
  return <ArchiveSubmitClient />
}
