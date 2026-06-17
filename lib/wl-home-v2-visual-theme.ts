export const WL_HOME_V2_VISUAL_THEME_STORAGE_KEY = "wted-wl-v2-visual-theme"

export const WL_HOME_V2_VISUAL_THEMES = [
  { id: "wted-default", label: "WTED Default" },
  { id: "big-modern", label: "BIG MODERN!" },
] as const

export type WlHomeV2VisualThemeId =
  (typeof WL_HOME_V2_VISUAL_THEMES)[number]["id"]

export const WL_HOME_V2_DEFAULT_VISUAL_THEME: WlHomeV2VisualThemeId =
  "wted-default"

export function isWlHomeV2VisualThemeId(
  value: string | null | undefined,
): value is WlHomeV2VisualThemeId {
  return value === "wted-default" || value === "big-modern"
}

export function readWlHomeV2VisualThemeFromStorage(): WlHomeV2VisualThemeId {
  if (typeof window === "undefined") {
    return WL_HOME_V2_DEFAULT_VISUAL_THEME
  }
  const stored = window.localStorage.getItem(WL_HOME_V2_VISUAL_THEME_STORAGE_KEY)
  return isWlHomeV2VisualThemeId(stored) ?
      stored
    : WL_HOME_V2_DEFAULT_VISUAL_THEME
}

export function writeWlHomeV2VisualThemeToStorage(
  theme: WlHomeV2VisualThemeId,
): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(WL_HOME_V2_VISUAL_THEME_STORAGE_KEY, theme)
}

export function applyWlHomeV2VisualThemeToDocument(
  theme: WlHomeV2VisualThemeId,
): void {
  if (typeof document === "undefined") return
  document.documentElement.dataset.wlV2Theme = theme
}
