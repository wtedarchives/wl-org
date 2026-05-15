"use client"

import { useEffect, useMemo } from "react"
import { toast } from "sonner"

import { LooseEndCard } from "@/components/dpro/profile/loose-end-card"
import { WlWidgetPanelLoading } from "@/components/dpro/wl-widget-panel-loading"
import { buttonVariants } from "@/components/ui/button"
import { useLooseEndsData } from "@/hooks/use-loose-ends-data"
import { cn } from "@/lib/utils"

/** First screen of badges: priority fetch for images. */
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
    toast.error("Could not load badges", { description: error })
  }, [error])

  if (!userId) {
    return (
      <div className="wl-profile-loose-ends-root">
        <p className="wl-profile-loose-ends-message">
          Sign in to view badges on your profile.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <WlWidgetPanelLoading
        message="Loading badges…"
        progress={loadingProgress}
      />
    )
  }

  if (error) {
    return (
      <div className="wl-profile-loose-ends-root">
        <div className="wl-profile-loose-ends-message">
          <p>Something went wrong while loading badges.</p>
          <div className="wl-profile-loose-ends-message-actions">
            <button
              type="button"
              onClick={() => refetch()}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="wl-profile-loose-ends-root">
        <p className="wl-profile-loose-ends-message">
          Nothing to show yet. Badges are collectible achievements from the site
          catalog; they will appear here by category once they exist and are
          marked visible.
        </p>
      </div>
    )
  }

  return (
    <div className="wl-profile-loose-ends-root wl-profile-loose-ends-main flex min-w-0 w-full flex-col gap-8">
      {attendedShowCount === 0 && (
        <div className="wl-profile-loose-ends-hint rounded-[10px] border border-dashed border-white/25 bg-black/35 px-4 py-4 backdrop-blur-sm">
          <p className="text-sm leading-relaxed text-white/65">
            {isOwnProfile ?
              "Add shows to your attended list to begin collecting badge progress."
            : "This user hasn't added any shows to their attended list yet."}
          </p>
        </div>
      )}

      <div className="flex min-w-0 w-full flex-col gap-4">
        {categories.map((category, categoryIndex) => {
          const items = groupedLooseEnds[category] ?? []
          const catDomId = `profile-badges-cat-${categoryIndex}-${slugId(category)}`
          return (
            <section
              key={category}
              className="wl-profile-loose-ends-category min-w-0 w-full"
              aria-labelledby={catDomId}
            >
              <div className="wl-profile-loose-ends-category__panel">
                <header className="wl-profile-loose-ends-category__head">
                  <h2 id={catDomId} className="wl-profile-loose-ends-category__title">
                    {category}
                  </h2>
                </header>
                <div className="wl-profile-loose-ends-category__grid">
                  {items.map((looseEnd) => (
                    <LooseEndCard
                      key={looseEnd.end_id}
                      looseEnd={looseEnd}
                      imagePriority={priorityBadgeIds.has(looseEnd.end_id)}
                    />
                  ))}
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function slugId(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}
