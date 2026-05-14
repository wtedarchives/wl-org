"use client"

import { useEffect, useMemo } from "react"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { LooseEndCard } from "@/components/dpro/profile/loose-end-card"
import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useLooseEndsData } from "@/hooks/use-loose-ends-data"
import { cn } from "@/lib/utils"

/** First N badges get preload + high fetch priority (roughly first screen across breakpoints). */
const LOOSE_END_BADGE_PRIORITY_COUNT = 16

interface LooseEndsContentProps {
  userId: string | null
  isOwnProfile: boolean
}

export function LooseEndsContent({
  userId,
  isOwnProfile,
}: LooseEndsContentProps) {
  const {
    groupedLooseEnds,
    categories,
    attendedShowCount,
    loading,
    loadingProgress,
    error,
    refetch,
  } = useLooseEndsData(userId)

  const priorityBadgeIds = useMemo(() => {
    const ids: string[] = []
    for (const category of categories) {
      for (const le of groupedLooseEnds[category] ?? []) {
        ids.push(le.end_id)
        if (ids.length >= LOOSE_END_BADGE_PRIORITY_COUNT) {
          return new Set(ids)
        }
      }
    }
    return new Set(ids)
  }, [categories, groupedLooseEnds])

  useEffect(() => {
    if (!error) return
    toast.error("Could not load Loose Ends", { description: error })
  }, [error])

  if (!userId) {
    return (
      <div className="wl-profile-loose-ends-root">
        <p className="wl-profile-loose-ends-message">
          Sign in to view Loose Ends on your profile.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <WlWidgetPanelLoading
        message="Loading Loose Ends data…"
        progress={loadingProgress}
      />
    )
  }

  if (error) {
    return (
      <div className="wl-profile-loose-ends-root">
        <div className="wl-profile-loose-ends-message">
          <p>
            Something went wrong while loading Loose Ends.
          </p>
          <div className="wl-profile-loose-ends-message-actions">
            <Button type="button" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="wl-profile-loose-ends-root">
        <p className="wl-profile-loose-ends-message">
          Nothing to show yet. Loose Ends are collectible badges from the site
          catalog; they will appear here by category once they exist and are
          marked visible.
        </p>
      </div>
    )
  }

  return (
    <div className="wl-profile-loose-ends-root flex min-w-0 w-full flex-col gap-4">
      {attendedShowCount === 0 && (
        <div className="widget-panel border-dashed px-4 py-4">
          <p className="text-sm leading-relaxed text-white/70">
            {isOwnProfile ?
              "Add shows to your attended list to begin collecting Loose Ends stubs."
            : "This user hasn't added any shows to their attended list yet."}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {categories.map((category) => {
          const items = groupedLooseEnds[category] ?? []
          return (
            <Collapsible key={category} defaultOpen>
              <div className="widget-panel overflow-hidden py-0">
                <CollapsibleTrigger
                  className={cn(
                    "group flex w-full min-h-11 items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-white/90 transition-all duration-200 ease-out hover:bg-white/[0.06]",
                    "touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  )}
                >
                  <span>{category}</span>
                  <ChevronDown
                    className="size-4 shrink-0 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
                    aria-hidden
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-white/10 px-4 pt-4 pb-4">
                    {/* Viewport: &lt;1024 → 1 · 1024–1279 → 2 · 1280–1685 → 3 · ≥1686 → 4 */}
                    <div className="grid grid-cols-1 gap-3 min-[1024px]:grid-cols-2 min-[1280px]:grid-cols-3 min-[1686px]:grid-cols-4">
                      {items.map((looseEnd) => (
                        <LooseEndCard
                          key={looseEnd.end_id}
                          looseEnd={looseEnd}
                          imagePriority={priorityBadgeIds.has(looseEnd.end_id)}
                        />
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
