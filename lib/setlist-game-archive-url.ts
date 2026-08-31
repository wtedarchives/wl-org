/** Existing Setlist Game UI lives at `/setlistgame2` (also `/archive/setlistgame2`). Rebuild root is `/archive/echo` (`getEchoArchiveIndexUrl`). */
export type SetlistGameArchiveUrlShell = "v2" | "legacy"

const SETLIST_GAME_PATH: Record<SetlistGameArchiveUrlShell, string> = {
  v2: "/setlistgame2",
  legacy: "/setlistgame2",
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
