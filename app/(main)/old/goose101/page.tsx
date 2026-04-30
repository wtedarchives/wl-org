import type { Metadata } from "next"

import { Goose101Legacy } from "@/components/goose101/goose101-legacy"

export const metadata: Metadata = {
  title: "Goose 101 (Classic)",
}

export default function OldGoose101Page() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-1 flex-col">
        <Goose101Legacy />
      </div>
    </div>
  )
}
