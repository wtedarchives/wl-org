"use client"

import { useEffect, useMemo } from "react"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { LooseEndCard } from "@/components/dpro/profile/loose-end-card"
import { LoadingPageCard } from "@/components/dpro/loading-page-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
      <Card>
        <CardContent className="py-6">
          <p className="text-muted-foreground text-sm">
            Sign in to view Loose Ends on your profile.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <LoadingPageCard
        message="Loading Loose Ends data…"
        progress={loadingProgress}
      />
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-muted-foreground text-center text-sm">
            Something went wrong while loading Loose Ends.
          </p>
          <Button type="button" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-muted-foreground text-sm">
            No Loose Ends are configured yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-4">
      {attendedShowCount === 0 && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-4">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {isOwnProfile
                ? "Add shows to your attended list to begin collecting Loose Ends stubs."
                : "This user hasn't added any shows to their attended list yet."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {categories.map((category) => {
          const items = groupedLooseEnds[category] ?? []
          return (
            <Collapsible key={category} defaultOpen>
              <Card className="overflow-hidden py-0 gap-0">
                <CollapsibleTrigger
                  className={cn(
                    "group flex w-full min-h-11 items-center justify-between gap-2 bg-muted/80 px-4 py-3 text-left text-sm font-semibold text-foreground transition-opacity hover:opacity-95",
                    "touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  <span>{category}</span>
                  <ChevronDown
                    className="size-4 shrink-0 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
                    aria-hidden
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="border-t border-border/60 pt-4 pb-4">
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
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
