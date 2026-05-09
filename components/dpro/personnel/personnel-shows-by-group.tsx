"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GuestShow } from "@/hooks/use-guest-data"

interface PersonnelShowsByGroupProps {
  performances: GuestShow[]
  selectedGroup: string | null
  onGroupClick: (group: string) => void
  stripLayout?: boolean
}

export function PersonnelShowsByGroup({
  performances,
  selectedGroup,
  onGroupClick,
  stripLayout = false,
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

  const list = (
    <ul className={stripLayout ? "group-count-list space-y-px" : "group-count-list"}>
      {sortedGroups.map(([group, count]) => (
        <li key={group}>
          <button
            type="button"
            onClick={() => onGroupClick(group)}
            className={
              stripLayout ?
                `group-count-btn${selectedGroup === group ? " active" : ""}`
              : `w-full px-2 py-1 text-left text-xs flex justify-between rounded transition-colors ${
                  selectedGroup === group
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/60"
                }`
            }
          >
            {stripLayout ?
              <>
                <span className="gn-name min-w-0 truncate">{group}</span>
                <span className="gn-count shrink-0">{count}</span>
              </>
            : <>
                <span>{group}</span>
                <span className="font-medium tabular-nums">{count}</span>
              </>
            }
          </button>
        </li>
      ))}
    </ul>
  )

  if (stripLayout) {
    return (
      <div className="card min-h-0 max-h-[min(420px,50vh)] flex flex-col overflow-hidden">
        <div className="card-head">
          <h3>Shows by Group</h3>
        </div>
        <div className="card-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto !pt-3">
          {list}
        </div>
      </div>
    )
  }

  return (
    <Card className="border-border/60 bg-card/80 overflow-hidden py-0 max-h-[400px] flex flex-col">
      <CardHeader className="bg-muted/60 py-2 shrink-0">
        <CardTitle className="text-sm font-semibold">Shows by Group</CardTitle>
      </CardHeader>
      <CardContent className="p-3 flex-1 min-h-0 overflow-y-auto">{list}</CardContent>
    </Card>
  )
}
