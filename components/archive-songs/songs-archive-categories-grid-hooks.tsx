"use client"

import { useEffect, useState } from "react"

import {
  coversSongGridColumnCountForViewport,
  tilesColumnCountForViewportWidth,
} from "@/components/archive-songs/songs-archive-categories-grid-math"

export function useCoverSongEightGridColumns(): number {
  const [cols, setCols] = useState(1)

  useEffect(() => {
    function read() {
      setCols(coversSongGridColumnCountForViewport(window.innerWidth))
    }
    read()
    window.addEventListener("resize", read)
    return () => window.removeEventListener("resize", read)
  }, [])

  return cols
}

export function useSongsArchiveCategoryGridColumns(): {
  cols: number
  hydrated: boolean
} {
  const [hydrated, setHydrated] = useState(false)
  const [cols, setCols] = useState(1)

  useEffect(() => {
    setHydrated(true)
    function read() {
      setCols(tilesColumnCountForViewportWidth(window.innerWidth))
    }
    read()
    window.addEventListener("resize", read)
    return () => window.removeEventListener("resize", read)
  }, [])

  return { cols, hydrated }
}
