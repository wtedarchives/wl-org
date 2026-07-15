"use client"

import { Megaphone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useInternalLinkInterceptor } from "@/hooks/use-internal-link-interceptor"

interface SetlistCallbacksProps {
  callbacks: string | null
}

export function SetlistCallbacks({ callbacks }: SetlistCallbacksProps) {
  const onLinkClick = useInternalLinkInterceptor()
  if (!callbacks || !callbacks.trim()) return null

  return (
    <Card className="border-border/60 bg-card/80 py-0">
      <CardContent className="flex items-start gap-2 p-3">
        <Megaphone className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
        <div
          onClick={onLinkClick}
          className="min-w-0 flex-1 text-xs text-white/80 [&_a]:font-semibold [&_a]:text-wl-orange [&_a]:hover:underline"
          dangerouslySetInnerHTML={{ __html: callbacks.trim() }}
        />
      </CardContent>
    </Card>
  )
}
