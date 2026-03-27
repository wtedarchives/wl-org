"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface SongDisplayNameProps {
  /** Canonical song name (songs.song) */
  song: string
  /** Display name (songs.song_displayname), falls back to song if null/empty */
  songDisplayName?: string | null
  /** Optional className for the wrapper */
  className?: string
  /** Render as a different element (e.g. span, div) */
  as?: "span" | "div"
  /** Child content - if provided, wraps children instead of rendering text */
  children?: React.ReactNode
  /**
   * When the name sits inside a link, hover underline reinforces that it’s clickable.
   * Set false for plain headings or body copy (e.g. song page title).
   */
  underlineOnHover?: boolean
}

/**
 * Displays song_displayname by default; on hover, animates to show songs.song.
 * Use this whenever displaying song names unless specified otherwise.
 */
export function SongDisplayName({
  song,
  songDisplayName,
  className,
  as: Component = "span",
  children,
  underlineOnHover = true,
}: SongDisplayNameProps) {
  const [isHovered, setIsHovered] = useState(false)
  const displayName = songDisplayName?.trim() || song
  const showCanonical = displayName !== song

  if (!showCanonical) {
    return (
      <Component
        className={cn(
          "min-w-0",
          underlineOnHover && "hover:underline",
          className,
        )}
      >
        {children ?? displayName}
      </Component>
    )
  }

  return (
    <Component
      className={cn(
        "relative inline-block max-w-full min-w-0 text-left",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className={cn(
          "transition-opacity duration-200",
          isHovered
            ? "pointer-events-none absolute left-0 top-0 opacity-0"
            : "relative opacity-100",
        )}
      >
        {children ?? displayName}
      </span>
      <span
        className={cn(
          "transition-opacity duration-200",
          isHovered
            ? cn(
                "relative opacity-100",
                underlineOnHover && "underline",
              )
            : "pointer-events-none absolute left-0 top-0 opacity-0",
        )}
        aria-hidden={!isHovered}
      >
        {song}
      </span>
    </Component>
  )
}
