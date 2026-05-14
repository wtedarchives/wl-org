/** Tab ids for {@link AdminPanel}; order is the left-to-right / mobile menu order. */
export const ADMIN_PANEL_TABS = [
  "Setlist",
  "Artist",
  "Song",
  "Personnel",
  "Show",
  "Changes",
  "Releases",
  "Discography",
  "Media",
  "Venue",
  "Subvenue",
  "WTED",
] as const

export type AdminPanelTab = (typeof ADMIN_PANEL_TABS)[number]

export const ADMIN_PANEL_ACTIVE_TAB_STORAGE_KEY = "adminActiveTab"

const ADMIN_PANEL_TAB_SET = new Set<string>(ADMIN_PANEL_TABS)

export function isAdminPanelTab(value: string): value is AdminPanelTab {
  return ADMIN_PANEL_TAB_SET.has(value)
}
