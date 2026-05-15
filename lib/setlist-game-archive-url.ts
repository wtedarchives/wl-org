/** Canonical `/archive/setlistgame`; `legacy` matches until old route tree is removed. */
export type SetlistGameArchiveUrlShell = "v2" | "legacy"

const SETLIST_GAME_PATH: Record<SetlistGameArchiveUrlShell, string> = {
  v2: "/archive/setlistgame",
  legacy: "/archive/setlistgame",
}

export function getSetlistGameArchiveIndexUrl(
  shell: SetlistGameArchiveUrlShell = "v2",
): string {
  return SETLIST_GAME_PATH[shell]
}

export function getSetlistGameShowArchiveUrl(
  showId: string,
  shell: SetlistGameArchiveUrlShell = "v2",
): string {
  return `${SETLIST_GAME_PATH[shell]}?id=${encodeURIComponent(showId)}`
}

export function getSetlistGameTourArchiveUrl(
  tourId: string,
  shell: SetlistGameArchiveUrlShell = "v2",
): string {
  return `${SETLIST_GAME_PATH[shell]}?tour_id=${encodeURIComponent(tourId)}`
}
