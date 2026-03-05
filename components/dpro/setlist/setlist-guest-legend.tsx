"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { GuestGroup } from "@/types/setlist"

interface SetlistGuestLegendProps {
  guestGroups: GuestGroup[]
}

export function SetlistGuestLegend({ guestGroups }: SetlistGuestLegendProps) {
  if (!guestGroups.length) return null

  return (
    <Card className="border-border/60 bg-card/80 py-0">
      <CardContent className="p-3">
        <p className="text-xs font-medium text-foreground mb-2">Guest legend</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {guestGroups.map((group, i) => (
            <li
              key={i}
              className="flex items-center gap-1.5"
            >
              <span
                className="size-3 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: group.color }}
                aria-hidden
              />
              <span className="text-muted-foreground">
                {group.guests.map((g) => g.guest_display_name).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
