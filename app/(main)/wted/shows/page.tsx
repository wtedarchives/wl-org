import type { Metadata } from "next"

import { WtedShows } from "@/components/wted-shows"

export const metadata: Metadata = {
  title: "Shows and More",
  description:
    "Scheduled shows and Goose content on WTED Goose Radio, including RequesTED, OnlyJams, and more.",
}

export default function WtedShowsPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <WtedShows />
      </div>
    </div>
  )
}
