import type { Metadata } from "next"

import { WtedInfo } from "@/components/wted-info"

export const metadata: Metadata = {
  title: "WTED Goose Radio",
}

export default function WtedInfoPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <WtedInfo />
      </div>
    </div>
  )
}

