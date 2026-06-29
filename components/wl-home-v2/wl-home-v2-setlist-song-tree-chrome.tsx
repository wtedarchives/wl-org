"use client"

import type { ReactNode } from "react"

import type { SetlistTreeChrome } from "@/lib/song-pairs"
import { cn } from "@/lib/utils"

import "./wl-home-v2-setlist-tree.css"

type WlHomeV2SetlistSongTreeChromeProps = {
  treeChrome?: SetlistTreeChrome
  children: ReactNode
}

export function WlHomeV2SetlistSongTreeChrome({
  treeChrome,
  children,
}: WlHomeV2SetlistSongTreeChromeProps) {
  if (!treeChrome || treeChrome.role === "parent") return children

  return (
    <div
      className={cn(
        "setlist-song-tree",
        "setlist-song-tree--child",
        treeChrome.isLastSibling ?
          "setlist-song-tree--child-last"
        : "setlist-song-tree--child-mid",
      )}
    >
      <div className="setlist-song-tree__gutter" aria-hidden="true" />
      <div className="setlist-song-tree__content">{children}</div>
    </div>
  )
}
