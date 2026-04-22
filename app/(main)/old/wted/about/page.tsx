import type { Metadata } from "next"

import { WtedAbout } from "@/components/wted/wted-about"

export const metadata: Metadata = {
  title: "About Us and FAQ",
}

export default function OldWtedAboutPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <WtedAbout />
      </div>
    </div>
  )
}
