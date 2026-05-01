"use client"

import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"

import "./tour-shows-stat-pill.css"

export type TourShowsStatPillProps = {
  fill: string
  border: string
  children: ReactNode
  className?: string
}

/**
 * Rarity / gap heatmap pill shared with tour show tables and stats archive.
 * Per-row colors use custom properties defined in `tour-shows-stat-pill.css`.
 */
export function TourShowsStatPill({
  fill,
  border,
  children,
  className,
}: TourShowsStatPillProps) {
  return (
    <span
      className={cn("tour-shows-stat-pill", className)}
      style={
        {
          "--tours-stat-pill-fill": fill,
          "--tours-stat-pill-border": border,
        } as CSSProperties
      }
    >
      {children}
    </span>
  )
}
