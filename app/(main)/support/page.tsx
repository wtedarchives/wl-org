import type { Metadata } from "next"

import { WtedSupport } from "@/components/wted-support"

export const metadata: Metadata = {
  title: "Support – WysteriaLane.org",
}

export default function SupportPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <WtedSupport />
      </div>
    </div>
  )
}

