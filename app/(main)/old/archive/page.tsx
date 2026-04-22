import type { Metadata } from "next"

import { ArchiveLanding } from "@/components/archive-landing"

export const metadata: Metadata = {
  title: "WTED Archives",
  description:
    "The ultimate show history archive for Goose. Browse years, tours, songs, stats, personnel, venues, and more.",
}

export default function ArchivePage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <ArchiveLanding />
      </div>
    </div>
  )
}
