"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Mono uppercase title + optional actions (setlist admin toolbar row pattern). */
export function AdminTabToolbar({
  title,
  children,
  className,
}: {
  title: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 shrink-0 flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2",
        className,
      )}
    >
      <span className="min-w-0 font-mono text-[11px] font-medium uppercase leading-snug tracking-[0.06em] text-white/90">
        {title}
      </span>
      {children ?
        <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
          {children}
        </div>
      : null}
    </div>
  )
}
