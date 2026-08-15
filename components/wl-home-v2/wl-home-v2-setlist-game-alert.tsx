import { Trophy } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

export function WlHomeV2SetlistGameAlert({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn("wl-home-v2-setlist-game-alert", className)}
      role="status"
    >
      <Trophy
        className="wl-home-v2-setlist-game-alert-icon"
        size={16}
        weight="regular"
        aria-hidden
      />
      <p>
        Setlist game is under construction and will return for the 2026 Fall
        Tour.
      </p>
    </div>
  )
}
