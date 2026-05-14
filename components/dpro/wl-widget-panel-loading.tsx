"use client"

import { CircleNotch } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

/** Match admin setlist tab: append `(n%)` while progress &lt; 100. */
export function formatWlWidgetLoadingMessage(
  message: string,
  progress?: number | null,
): string {
  if (progress === undefined || progress === null || progress >= 100) {
    return message
  }
  return `${message} (${Math.round(progress)}%)`
}

export interface WlWidgetPanelLoadingProps {
  message: string
  /** 0–99: formatted like admin setlist (`message (42%)`). Omit when message already includes the percent. */
  progress?: number | null
  /** Tighter vertical padding for loading inside a smaller shell (e.g. stat panel body). */
  embedded?: boolean
  className?: string
}

/**
 * Frosted `widget-panel` loading block — same chrome/behavior as setlist admin
 * ({@link components/dpro/admin/admin-setlist.tsx}).
 */
export function WlWidgetPanelLoading({
  message,
  progress,
  embedded = false,
  className,
}: WlWidgetPanelLoadingProps) {
  const text = formatWlWidgetLoadingMessage(message, progress)

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "widget-panel wl-home-v2-admin-setlist-loading flex min-h-0 w-full min-w-0 flex-col items-center justify-center gap-4 px-4",
        embedded ? "flex-1 py-8" : "flex-1 py-12",
        className,
      )}
    >
      <CircleNotch
        className="size-8 shrink-0 animate-spin text-[var(--wl-light-orange)]"
        aria-hidden
      />
      <p className="m-0 max-w-sm text-center text-sm leading-relaxed text-white/80">
        {text}
      </p>
    </div>
  )
}
