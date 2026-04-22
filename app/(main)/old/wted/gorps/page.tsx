import type { Metadata } from "next"

import { WtedGorps } from "@/components/wted-gorps"

export const metadata: Metadata = {
  title: "GORPs & Contributors",
  description:
    "Goose Obsessed Radio Personalities (GORPs) and station contributors at WTED Goose Radio.",
}

export default function OldWtedGorpsPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <WtedGorps />
      </div>
    </div>
  )
}
