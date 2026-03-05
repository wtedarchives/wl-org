"use client"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistSongPerformancesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: SetlistEntry | null
  tourName: string | null
}

export function SetlistSongPerformancesSheet({
  open,
  onOpenChange,
  entry,
  tourName,
}: SetlistSongPerformancesSheetProps) {
  const songLabel = entry
    ? [entry.entry_song, entry.entry_short && `[${entry.entry_short}]`]
        .filter(Boolean)
        .join(" ")
    : ""
  const tourCount = entry?.song_tour_count ?? "—"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] flex flex-col rounded-t-xl"
        showCloseButton={true}
      >
        <div className="space-y-3 pb-6">
          <h2 className="text-sm font-semibold">Tour performances</h2>
          {entry ? (
            <div className="space-y-2 text-xs">
              <p className="font-medium text-foreground">{songLabel}</p>
              {tourName && (
                <p className="text-muted-foreground">
                  {tourName}
                </p>
              )}
              <p className="text-muted-foreground">
                This tour: <span className="font-medium text-foreground">{tourCount}</span>{" "}
                {tourCount === "1" ? "performance" : "performances"}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No song selected.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
