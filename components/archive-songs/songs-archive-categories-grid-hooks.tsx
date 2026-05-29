"use client"

import { useLayoutEffect, useState } from "react"

import {
  coversSongGridColumnCountForViewport,
  tilesColumnCountForViewportWidth,
} from "@/components/archive-songs/songs-archive-categories-grid-math"

function readCategoryGridColumns(): number {
  if (typeof window === "undefined") return 1
  return tilesColumnCountForViewportWidth(window.innerWidth)
}

function readCoverSongGridColumns(): number {
  if (typeof window === "undefined") return 1
  return coversSongGridColumnCountForViewport(window.innerWidth)
}

export function useCoverSongEightGridColumns(): number {
  const [cols, setCols] = useState(readCoverSongGridColumns)

  useLayoutEffect(() => {
    function read() {
      setCols(coversSongGridColumnCountForViewport(window.innerWidth))
    }
    read()
    window.addEventListener("resize", read)
    return () => window.removeEventListener("resize", read)
  }, [])

  return cols
}

export function useSongsArchiveCategoryGridColumns(): number {
  const [cols, setCols] = useState(readCategoryGridColumns)

  useLayoutEffect(() => {
    function read() {
      setCols(tilesColumnCountForViewportWidth(window.innerWidth))
    }
    read()
    window.addEventListener("resize", read)
    return () => window.removeEventListener("resize", read)
  }, [])

  return cols
}
