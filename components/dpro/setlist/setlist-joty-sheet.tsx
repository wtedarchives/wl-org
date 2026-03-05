"use client"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { SetlistEntry } from "@/types/setlist"

interface SetlistJotySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: SetlistEntry | null
}

export function SetlistJotySheet({
  open,
  onOpenChange,
  entry,
}: SetlistJotySheetProps) {
  const songLabel = entry
    ? [entry.entry_song, entry.entry_short && `[${entry.entry_short}]`]
        .filter(Boolean)
        .join(" ")
    : ""
  const round = entry?.joty_round ?? null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] flex flex-col rounded-t-xl"
        showCloseButton={true}
      >
        <div className="space-y-3 pb-6">
          <h2 className="text-sm font-semibold">Jam of the Year (JOTY)</h2>
          {entry ? (
            <div className="space-y-2 text-xs">
              <p className="font-medium text-foreground">{songLabel}</p>
              {round && (
                <p className="text-muted-foreground">
                  Round achieved: <span className="font-medium text-foreground">{round}</span>
                </p>
              )}
              <p className="text-muted-foreground">
                This performance was selected as a Jam of the Year.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No entry selected.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
