"use client"

import { RadioMobileSlot } from "@/components/persistent-radio"
import { useIsBelowXl } from "@/hooks/use-mobile"

/**
 * Below 1344px (`DESKTOP_CONTENT_MIN_WIDTH`): persistent radio mount above the header (all routes, including `/`).
 * At that width and up: renders nothing so the mobile slot ref never attaches.
 */
export function MobileRadioBar() {
  const isBelowXl = useIsBelowXl()

  if (!isBelowXl) return null

  return (
    <div className="shrink-0 border-b border-border bg-background px-2 py-1.5">
      <RadioMobileSlot />
    </div>
  )
}
