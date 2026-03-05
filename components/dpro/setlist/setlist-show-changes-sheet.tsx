"use client"

import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { ShowChangeRow } from "@/hooks/use-setlist-show-changes"

interface SetlistShowChangesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  changes: ShowChangeRow[]
}

export function SetlistShowChangesSheet({
  open,
  onOpenChange,
  changes,
}: SetlistShowChangesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] flex flex-col rounded-t-xl"
        showCloseButton={true}
      >
        <div className="space-y-3 pb-6">
          <h2 className="text-sm font-semibold">Show changes</h2>
          {changes.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No changes recorded for this show.
            </p>
          ) : (
            <ul className="space-y-2">
              {changes.map((c) => (
                <li
                  key={c.show_change_uuid}
                  className="rounded border border-border/60 bg-muted/30 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-foreground">
                    {c.change_type}:
                  </span>{" "}
                  <span className="text-muted-foreground">{c.change}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
