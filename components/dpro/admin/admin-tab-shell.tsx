"use client"

import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * WL Home v2 archive admin tab chrome: B&W hero tile + padded main column
 * (same layout as the Setlist admin tab).
 */
export function AdminTabShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "wl-home-v2-archive-admin-tab-shell wl-home-v2-years-page min-h-0",
        className,
      )}
    >
      <div className="wl-home-v2-years-body min-h-0">
        <section
          className="wl-home-v2-archive-admin-tab-tile wl-home-v2-years-tile wl-home-v2-years-tile--main min-h-0 min-w-0 flex-1"
          style={
            {
              "--tile-bg": "url('/newbg3.jpeg')",
            } as CSSProperties
          }
        >
          <div className="wl-home-v2-years-tile-inner wl-home-v2-tour-page-main flex min-h-[200px] min-w-0 flex-1 flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4">
            {children}
          </div>
        </section>
      </div>
    </div>
  )
}
