"use client"

import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer"
import type { SetlistEntry } from "@/types/setlist"
import {
  SetlistWtedPanel,
  type SetlistWtedShowContext,
} from "./setlist-wted-panel"

export type { SetlistWtedShowContext }

interface SetlistWtedSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: SetlistEntry | null
  setlist: SetlistEntry[]
  show: SetlistWtedShowContext
  fallbackReleaseArtwork: string | null
}

export function SetlistWtedSheet({
  open,
  onOpenChange,
  entry,
  setlist,
  show,
  fallbackReleaseArtwork,
}: SetlistWtedSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto w-full max-w-xl text-xs">
        <SetlistWtedPanel
          open={open}
          onOpenChange={onOpenChange}
          entry={entry}
          setlist={setlist}
          show={show}
          fallbackReleaseArtwork={fallbackReleaseArtwork}
          variant="drawer"
        />
      </DrawerContent>
    </Drawer>
  )
}
