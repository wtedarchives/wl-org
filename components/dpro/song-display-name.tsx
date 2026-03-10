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
}: SongDisplayNameProps) {
  const [isHovered, setIsHovered] = useState(false)
  const displayName = songDisplayName?.trim() || song
  const showCanonical = displayName !== song

  if (!showCanonical) {
    return (
      <Component className={className}>
        {children ?? displayName}
      </Component>
    )
  }

  return (
    <Component
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span
        className={cn(
          "transition-opacity duration-200",
          isHovered ? "opacity-0 absolute left-0 top-0" : "opacity-100",
        )}
      >
        {children ?? displayName}
      </span>
      <span
        className={cn(
          "transition-opacity duration-200",
          isHovered ? "opacity-100" : "opacity-0 absolute left-0 top-0",
        )}
      >
        {song}
      </span>
    </Component>
  )
}
