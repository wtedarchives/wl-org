"use client"

import { Card, CardContent } from "@/components/ui/card"

interface SetlistCallbacksProps {
  callbacks: string | null
}

export function SetlistCallbacks({ callbacks }: SetlistCallbacksProps) {
  if (!callbacks || !callbacks.trim()) return null

  return (
    <Card className="border-border/60 bg-card/80 py-0">
      <CardContent className="p-3">
        <div
          className="text-xs text-muted-foreground [&_a]:bg-[#844240] [&_a]:font-medium [&_a]:text-wl-white [&_a]:rounded-full [&_a]:px-1.5 [&_a]:py-0.5 [&_a]:hover:underline"
          dangerouslySetInnerHTML={{ __html: callbacks.trim() }}
        />
      </CardContent>
    </Card>
  )
}
