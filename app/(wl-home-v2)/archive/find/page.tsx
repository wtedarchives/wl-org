import type { Metadata } from "next"

import { ArchiveFindClient } from "./archive-find-client"

export const metadata: Metadata = {
  title: "Find",
}

export default function ArchiveFindPage() {
  return <ArchiveFindClient />
}
