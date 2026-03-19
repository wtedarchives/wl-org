"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const REQUEST_IFRAME_SRC = "https://embed.radio.co/request/w2255950.html"

const cardClassName =
  "flex h-full flex-col rounded-xl border border-wl-dark-grey/50 bg-[#313a34] py-0 text-xs shadow-sm ring-0 min-h-0"

export function WtedRequestSongCard() {
  return (
    <Card className={cardClassName}>
      <CardHeader className="shrink-0 border-b border-wl-dark-grey/50 py-2 bg-black/30">
        <CardTitle className="text-[13px] font-semibold text-wl-white">
          Request a Song
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 p-0">
        <iframe
          src={REQUEST_IFRAME_SRC}
          title="WTED Request a Song"
          allow="autoplay"
          scrolling="no"
          className="h-full w-full min-h-[120px] rounded-b-xl"
        />
      </CardContent>
    </Card>
  )
}
