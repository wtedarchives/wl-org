"use client"

import { useCallback, useEffect, useState } from "react"

import {
  applyWlHomeV2VisualThemeToDocument,
  readWlHomeV2VisualThemeFromStorage,
  WL_HOME_V2_DEFAULT_VISUAL_THEME,
  type WlHomeV2VisualThemeId,
  writeWlHomeV2VisualThemeToStorage,
} from "@/lib/wl-home-v2-visual-theme"

export function useWlHomeV2VisualTheme() {
  const [theme, setThemeState] = useState<WlHomeV2VisualThemeId>(
    WL_HOME_V2_DEFAULT_VISUAL_THEME,
  )

  useEffect(() => {
    const stored = readWlHomeV2VisualThemeFromStorage()
    setThemeState(stored)
    applyWlHomeV2VisualThemeToDocument(stored)
  }, [])

  const setTheme = useCallback((next: WlHomeV2VisualThemeId) => {
    writeWlHomeV2VisualThemeToStorage(next)
    applyWlHomeV2VisualThemeToDocument(next)
    setThemeState(next)
  }, [])

  return { theme, setTheme }
}
