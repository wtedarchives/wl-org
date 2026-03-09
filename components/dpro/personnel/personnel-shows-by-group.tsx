"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GuestShow } from "@/hooks/use-guest-data"

interface PersonnelShowsByGroupProps {
  performances: GuestShow[]
  selectedGroup: string | null
  onGroupClick: (group: string) => void
}

export function PersonnelShowsByGroup({
  performances,
  selectedGroup,
  onGroupClick,
}: PersonnelShowsByGroupProps) {
  if (performances.length === 0) return null

  const groupCounts = performances.reduce(
    (acc, show) => {
      const group = show.show_group || "Unknown"
      acc[group] = (acc[group] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const sortedGroups = Object.entries(groupCounts)
    .sort(([a, aCount], [b, bCount]) => {
      if (bCount !== aCount) return bCount - aCount
      return a.localeCompare(b)
    })

  return (
    <Card className="border-border/60 bg-card/80 overflow-hidden py-0 max-h-[400px] flex flex-col">
      <CardHeader className="bg-muted/60 py-2 shrink-0">
        <CardTitle className="text-sm font-semibold">Shows by Group</CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-0.5">
          {sortedGroups.map(([group, count]) => (
            <button
              key={group}
              type="button"
              onClick={() => onGroupClick(group)}
              className={`w-full px-2 py-1 text-left text-xs flex justify-between rounded transition-colors ${
                selectedGroup === group
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted/60"
              }`}
            >
              <span>{group}</span>
              <span className="font-medium tabular-nums">{count}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
