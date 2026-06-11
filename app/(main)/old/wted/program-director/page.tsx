import type { Metadata } from "next"

import { ProgramDirectorContent } from "@/components/wted/program-director-content"

export const metadata: Metadata = {
  title: "Episodes",
  description:
    "WTED Radio shows and episodes with links to published track listings.",
}

export default function OldWtedProgramDirectorPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <ProgramDirectorContent variant="legacy" />
      </div>
    </div>
  )
}
