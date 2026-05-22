"use client"

import { Plus } from "@phosphor-icons/react"

/** Expand control: yellow circle + black plus (matches personnel / coach notes). */
export const SETLIST_EXPAND_BUTTON_CLASS =
  "inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-yellow-500 px-1 text-black shadow-sm transition-colors hover:bg-yellow-500/90 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"

type SetlistExpandButtonProps = {
  onClick: () => void
  ariaLabel: string
  className?: string
}

export function SetlistExpandButton({
  onClick,
  ariaLabel,
  className,
}: SetlistExpandButtonProps) {
  return (
    <button
      type="button"
      className={className ?? SETLIST_EXPAND_BUTTON_CLASS}
      onClick={onClick}
      aria-expanded={false}
      aria-label={ariaLabel}
    >
      <Plus className="size-3.5 text-black" weight="bold" aria-hidden />
    </button>
  )
}
