"use client"

import { X } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { SetlistRatingCard } from "./setlist-rating-card"
import { SetlistAttendanceCard } from "./setlist-attendance-card"
import { SetlistSidebar } from "./setlist-sidebar"
import type { Show, SetlistEntry } from "@/types/setlist"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"
interface SetlistSidebarSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  show: Show
  setlist: SetlistEntry[]
  showLengthRank: number | null
  averageRating: number
  reviewCount: number
  attendeeCount: number
  attended: boolean
  toggling: boolean
  onToggle: () => void
  user: { id: string } | null
  onRatingClick: () => void
  changes: ShowChangeRow[]
  changesLoading: boolean
  hasSetlistScan?: boolean
  onOpenSetlistScan?: () => void
  hoveredCategory: string | null
  onCategoryHover: (category: string | null) => void
}

export function SetlistSidebarSheet({
  open,
  onOpenChange,
  show,
  setlist,
  showLengthRank,
  averageRating,
  reviewCount,
  attendeeCount,
  attended,
  toggling,
  onToggle,
  user,
  onRatingClick,
  changes,
  changesLoading,
  hasSetlistScan,
  onOpenSetlistScan,
  hoveredCategory,
  onCategoryHover,
}: SetlistSidebarSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] flex flex-col rounded-t-none overflow-hidden"
        showCloseButton={false}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="flex w-full items-center justify-center gap-2 border-b border-border/50 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Close"
        >
          <X className="size-4" />
          Close
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-3 max-w-[280px] mx-auto">
            <SetlistRatingCard
              averageRating={averageRating}
              reviewCount={reviewCount}
              onClick={onRatingClick}
            />
            <SetlistAttendanceCard
              attendeeCount={attendeeCount}
              attended={attended}
              toggling={toggling}
              onToggle={onToggle}
              showAttendButton={!!user}
            />
            <SetlistSidebar
              show={show}
              setlist={setlist}
              showLengthRank={showLengthRank}
              changes={changes}
              changesLoading={changesLoading}
              hasSetlistScan={hasSetlistScan}
              onOpenSetlistScan={
                onOpenSetlistScan
                  ? () => {
                      onOpenSetlistScan()
                      onOpenChange(false)
                    }
                  : undefined
              }
              hoveredCategory={hoveredCategory}
              onCategoryHover={onCategoryHover}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
