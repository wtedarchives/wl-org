"use client"

import type { ReactNode } from "react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

export function SetlistWtedPanelDrawerChrome({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <DrawerHeader className="flex flex-col items-center justify-center gap-1 border-b border-border/60 pt-1 pb-3 text-center">
        <DrawerTitle className="sr-only">WTED Goose Radio</DrawerTitle>
        <div className="flex items-center justify-center gap-2">
          <Image
            src="/WTED2.png"
            alt="WTED Goose Radio"
            width={32}
            height={32}
            className="size-6 object-contain"
          />
          <p className="text-sm font-medium text-foreground">
            WTED Goose Radio
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Users can request four tracks every 60 minutes.
        </p>
      </DrawerHeader>
      {children}
      <DrawerFooter className="border-t border-border/60 pt-3">
        <div className="flex justify-end">
          <DrawerClose asChild>
            <Button type="button" size="sm" variant="ghost">
              Close
            </Button>
          </DrawerClose>
        </div>
      </DrawerFooter>
    </>
  )
}
