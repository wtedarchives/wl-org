"use client"

import { getPersonnelArchiveUrl } from "@/lib/personnel-archive-url"
import Link from "next/link"
import { X } from "lucide-react"
import { GuestAppearancesDetailTable } from "@/components/dpro/tours/guest-appearances-detail-table"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import type { SongWithGuest } from "@/hooks/use-guest-appearances"

export interface GuestAppearancesDrawerProps {
  modalData: {
    isOpen: boolean
    guestId: string
    guestName: string
    guestInstrument: string | null
    songs: SongWithGuest[]
    tourName: string
  }
  onOpenChange: (open: boolean) => void
}

export function GuestAppearancesDrawer({
  modalData,
  onOpenChange,
}: GuestAppearancesDrawerProps) {
  return (
    <Drawer
      open={modalData.isOpen}
      onOpenChange={onOpenChange}
    >
      <DrawerContent className="mx-auto w-full max-w-4xl text-xs flex flex-col max-h-[90vh] data-[vaul-drawer-direction=bottom]:max-h-[90vh] data-[vaul-drawer-direction=bottom]:min-h-[70vh] after:!h-0">
        <DrawerHeader className="shrink-0 border-b border-border/60 pt-1 pb-3 px-4 flex flex-row items-center justify-between md:justify-center gap-3">
          <div className="w-8 shrink-0 md:hidden" aria-hidden />
          <div className="flex flex-1 min-w-0 justify-center">
            <div className="space-y-1.5 text-center">
              <DrawerTitle className="text-sm font-medium text-foreground m-0 mb-0.5">
                {modalData.guestName}
              </DrawerTitle>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {modalData.guestInstrument && (
                  <span className="inline-flex items-center rounded-full bg-wl-orange/20 px-2 py-0.5 text-[10px] font-medium text-wl-orange">
                    {modalData.guestInstrument}
                  </span>
                )}
                {modalData.tourName && (
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {modalData.tourName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <DrawerClose asChild>
            <button
              type="button"
              className="w-8 h-8 shrink-0 rounded-sm p-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring md:hidden flex items-center justify-center"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 min-h-0 overflow-auto px-4 pb-4 pt-2">
          <GuestAppearancesDetailTable
            songs={modalData.songs}
            variant="drawer"
            onNavigate={() => onOpenChange(false)}
          />
        </div>

        <DrawerFooter className="border-t border-border/60 shrink-0 pt-3 pb-4">
          <div className="flex flex-col items-stretch justify-end gap-2 sm:flex-row sm:items-center sm:justify-center">
            <Button variant="outline" size="sm" asChild>
              <Link
                href={getPersonnelArchiveUrl(modalData.guestId)}
                onClick={() => onOpenChange(false)}
              >
                Guest Profile
              </Link>
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
