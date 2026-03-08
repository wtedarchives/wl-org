import { Suspense } from "react"
import { SongsContent } from "@/components/dpro/songs/songs-content"

export const metadata = {
  title: "Songs – Wysteria Lane",
}

export default function DproSongsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">Loading songs…</p>
        </div>
      }
    >
      <SongsContent />
    </Suspense>
  )
}
