"use client"

import Link from "next/link"
import type { ComponentProps } from "react"

import { useArchivePrefetchHandlers } from "@/hooks/use-archive-prefetch"

export type ArchivePrefetchLinkProps = ComponentProps<typeof Link> & {
  /** When false, behaves like a normal Next.js Link. Default true. */
  prefetchArchive?: boolean
}

/**
 * Next.js Link that prefetches archive entity data (setlist / song / tour core)
 * on hover, focus, or touch after a short delay.
 */
export function ArchivePrefetchLink({
  prefetchArchive = true,
  href,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onTouchStart,
  ...props
}: ArchivePrefetchLinkProps) {
  const { schedulePrefetchFromHref, cancelScheduledPrefetch } =
    useArchivePrefetchHandlers()

  const hrefString = typeof href === "string" ? href : null

  const maybeSchedule = () => {
    if (!prefetchArchive || !hrefString) return
    schedulePrefetchFromHref(hrefString)
  }

  return (
    <Link
      href={href}
      onMouseEnter={(e) => {
        maybeSchedule()
        onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        cancelScheduledPrefetch()
        onMouseLeave?.(e)
      }}
      onFocus={(e) => {
        maybeSchedule()
        onFocus?.(e)
      }}
      onTouchStart={(e) => {
        maybeSchedule()
        onTouchStart?.(e)
      }}
      {...props}
    />
  )
}
