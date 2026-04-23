"use client"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Funnel } from "@phosphor-icons/react"
import type { GroupCount } from "@/hooks/use-groups-data"

interface GroupFiltersCardProps {
  groups: GroupCount[]
  selectedGroups: string[]
  onToggleGroup: (group: string) => void
  onClearFilters: () => void
  loading: boolean
  className?: string
  wlHomeV2?: boolean
  /** Hide panel title / Clear when wrapped in a modal (shell provides those). */
  embedInModal?: boolean
}

export function GroupFiltersCard({
  groups,
  selectedGroups,
  onToggleGroup,
  onClearFilters,
  loading,
  className,
  wlHomeV2 = false,
  embedInModal = false,
}: GroupFiltersCardProps) {
  const clearButton = (
    <button
      type="button"
      onClick={onClearFilters}
      className="rounded-md border border-white/18 bg-white/5 !px-2 !py-0.5 text-[11px] font-medium text-white/85 transition-colors hover:border-[rgba(88,200,174,0.5)] hover:bg-[rgba(88,200,174,0.15)]"
    >
      Clear
    </button>
  )

  if (wlHomeV2) {
    return (
      <div
        className={cn(
          "widget-panel",
          embedInModal && "wl-home-v2-years-tool-popup-panel--groups",
          className,
        )}
      >
        {!embedInModal ?
          <div className="wp-head">
            <span>Filter by Group</span>
            {selectedGroups.length > 0 ?
              <div className="wp-head-right">{clearButton}</div>
            : null}
          </div>
        : null}
        {loading ?
          <div className="py-3 text-center text-xs text-white/55">
            Loading groups…
          </div>
        : groups.length === 0 ?
          <div className="py-3 text-center text-xs text-white/55">
            No groups found.
          </div>
        : (
          <div className="wl-home-v2-years-filter-list max-h-64 min-h-0 overflow-y-auto overscroll-contain">
            {groups.map((group) => {
              const isSelected = selectedGroups.includes(group.group)
              return (
                <button
                  key={group.group}
                  type="button"
                  data-selected={isSelected ? true : undefined}
                  onClick={() => onToggleGroup(group.group)}
                  className={cn(
                    "years-filter-button",
                    isSelected &&
                      "!rounded-[10px] !border-[rgba(88,200,174,0.35)] !bg-[rgba(88,200,174,0.16)]",
                  )}
                >
                  <span className="min-w-0 flex-1 font-medium">
                    {group.group}
                  </span>
                  <span className="count">{group.count}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card
      className={cn(
        "ring-0 border border-border/60 bg-card/80 py-0",
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
            <Funnel className="size-3" aria-hidden />
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

