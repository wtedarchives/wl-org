import type { Metadata } from "next"

import { ProgramDirectorContent } from "@/components/wted/program-director-content"

export const metadata: Metadata = {
  title: "Program Director – WysteriaLane.org",
  description:
    "WTED Radio shows and episodes with links to published track listings.",
}

export default function WtedProgramDirectorPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <ProgramDirectorContent />
      </div>
    </div>
  )
}
