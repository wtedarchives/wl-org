"use client"

import { Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const REQUEST_IFRAME_SRC = "https://embed.radio.co/request/w2255950.html"

const cardClassName =
  "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-wl-dark-grey/50 bg-[#313a34] py-0 text-xs shadow-sm ring-0"

export function WtedRequestSongCard({
  className,
  hideHeader = false,
}: {
  className?: string
  hideHeader?: boolean
}) {
  return (
    <Card className={cn(cardClassName, className)}>
      {!hideHeader ? (
        <CardHeader className="shrink-0 border-b border-wl-dark-grey/50 py-2 bg-black/30">
          <div className="flex min-w-0 flex-row items-center justify-between gap-2">
            <CardTitle className="shrink-0 text-[13px] font-semibold text-wl-white">
              Request a Song
            </CardTitle>
            <Pencil className="size-4 shrink-0 text-wl-white/80" />
          </div>
        </CardHeader>
      ) : null}
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
