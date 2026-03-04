"use client"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import type { GroupCount } from "@/hooks/use-groups-data"

interface GroupFiltersCardProps {
  groups: GroupCount[]
  selectedGroups: string[]
  onToggleGroup: (group: string) => void
  onClearFilters: () => void
  loading: boolean
  className?: string
}

export function GroupFiltersCard({
  groups,
  selectedGroups,
  onToggleGroup,
  onClearFilters,
  loading,
  className,
}: GroupFiltersCardProps) {
  return (
    <Card
      className={cn(
        "ring-0 border border-border/60 bg-card/80",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 py-2">
        <CardTitle className="text-sm font-semibold">
          Filter by Group
        </CardTitle>
        {selectedGroups.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={onClearFilters}
          >
            <span>Clear</span>
            <Filter className="size-3" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center px-3 py-4 text-xs text-muted-foreground">
            Loading groups…
          </div>
        ) : groups.length === 0 ? (
          <div className="px-3 py-3 text-center text-xs text-muted-foreground">
            No groups found.
          </div>
        ) : (
          <div className="max-h-64 space-y-0.5 overflow-y-auto px-2 py-2 text-[11px]">
            {groups.map((group) => {
              const isSelected = selectedGroups.includes(group.group)
              return (
                <button
                  key={group.group}
                  type="button"
                  onClick={() => onToggleGroup(group.group)}
                  className={`flex w-full items-center justify-between rounded px-1.5 py-1 text-left transition-colors ${
                    isSelected
                      ? "bg-primary/80 text-primary-foreground"
                      : "hover:bg-muted/60"
                  }`}
                >
                  <span className="font-medium">{group.group}</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({group.count})
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

