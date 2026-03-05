"use client"

import Image from "next/image"
import Link from "next/link"
import { Sheet, SheetContent } from "@/components/ui/sheet"

const WTED_RATE_LIMIT_KEY = "setlist-wted-sheet-last-open"
const WTED_RATE_LIMIT_MS = 60_000 // 1 minute

export function getWtedRateLimited(): boolean {
  if (typeof window === "undefined") return false
  const last = sessionStorage.getItem(WTED_RATE_LIMIT_KEY)
  if (!last) return false
  return Date.now() - Number(last) < WTED_RATE_LIMIT_MS
}

function setWtedRateLimit() {
  if (typeof window === "undefined") return
  sessionStorage.setItem(WTED_RATE_LIMIT_KEY, String(Date.now()))
}

interface SetlistWtedSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: { entry_song: string; radio_id?: string | null } | null
}

export function SetlistWtedSheet({
  open,
  onOpenChange,
  entry,
}: SetlistWtedSheetProps) {
  const handleOpenChange = (next: boolean) => {
    if (!next) setWtedRateLimit()
    onOpenChange(next)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] flex flex-col rounded-t-xl"
        showCloseButton={true}
      >
        <div className="space-y-4 pb-6">
          <div className="flex items-center gap-2">
            <Image
              src="/WTED.png"
              alt="WTED Goose Radio"
              width={32}
              height={32}
              className="size-8"
            />
            <h2 className="text-sm font-semibold">WTED Goose Radio</h2>
          </div>
          {entry && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{entry.entry_song}</span>
              {" — "}
              Listen to this performance on WTED.
            </p>
          )}
          <Link
            href="/wted/info"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Image src="/WTED.png" alt="" width={20} height={20} className="size-5" />
            Stream WTED Goose Radio
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
