"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WtedRequestSongFlow } from "@/components/wted/wted-request-song-flow"
import { cn } from "@/lib/utils"

// const REQUEST_IFRAME_SRC = "https://embed.radio.co/request/w2255950.html"

const cardClassName =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-[#313a34] py-0 text-xs shadow-sm ring-0"

function RequestSongHeaderBar({ hideHeader }: { hideHeader: boolean }) {
  if (hideHeader) return null

  return (
    <CardHeader className="shrink-0 border-b border-wl-dark-grey/50 bg-black/30 py-2">
      <CardTitle className="min-w-0 shrink text-[13px] font-semibold text-wl-white">
        Request a Song
      </CardTitle>
    </CardHeader>
  )
}

export function WtedRequestSongCard({
  className,
  hideHeader = false,
  /**
   * When false, the catalog list does not fetch until this becomes true (e.g. XL column
   * scrolls into view).
   */
  catalogFetchEnabled = true,
}: {
  className?: string
  hideHeader?: boolean
  catalogFetchEnabled?: boolean
}) {
  return (
    <Card className={cn(cardClassName, className)}>
      <RequestSongHeaderBar hideHeader={hideHeader} />
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <WtedRequestSongFlow catalogFetchEnabled={catalogFetchEnabled} />
      </CardContent>
    </Card>
  )
}
