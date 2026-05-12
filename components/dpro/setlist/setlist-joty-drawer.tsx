"use client"

import { X } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import {
  JOTY_DESCRIPTION,
  JotyBracketSponsorLogos,
  SetlistJotyBracketDataBody,
} from "@/components/dpro/setlist/setlist-joty-bracket-content"

interface SetlistJotyDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number | null
  highlightedEntryId: string | null
}

export function SetlistJotyDrawer({
  open,
  onOpenChange,
  year,
  highlightedEntryId,
}: SetlistJotyDrawerProps) {
  const displayYear = year ?? 0

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto flex max-h-[90vh] w-full max-w-[800px] flex-col rounded-t-xl outline-none ring-0 focus:ring-0 focus:outline-none focus-visible:outline-none [&:focus]:outline-none [&:focus-visible]:outline-none">
        <DrawerHeader className="flex shrink-0 flex-row items-center gap-2 border-b border-border pb-3 pt-0">
          <div className="min-w-0 flex-1" aria-hidden />
          <div className="flex min-w-0 shrink-0 flex-col items-center justify-center px-2 text-center">
            <DrawerTitle className="text-base font-semibold">
              Jam of the Year {displayYear}
            </DrawerTitle>
          </div>
          <div className="flex min-w-0 flex-1 justify-end">
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-full"
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <SetlistJotyBracketDataBody
            open={open}
            year={year}
            highlightedEntryId={highlightedEntryId}
            onNavigate={() => onOpenChange(false)}
          />
        </div>

        <DrawerFooter className="shrink-0 border-t border-border bg-muted/30 py-3">
          <div className="flex w-full flex-row items-center gap-3">
            <JotyBracketSponsorLogos />
            <p className="min-w-0 flex-1 text-left text-xs leading-snug text-muted-foreground">
              {JOTY_DESCRIPTION}
            </p>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
