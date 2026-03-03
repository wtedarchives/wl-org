import type { Metadata } from "next"

import { WtedSupport } from "@/components/wted-support"

export const metadata: Metadata = {
  title: "Support WTED",
}

export default function WtedSupportPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <WtedSupport />
      </div>
    </div>
  )
}

