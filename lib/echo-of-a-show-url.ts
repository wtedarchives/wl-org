/** Echo of a Show (rebuilt Setlist Game) at `/archive/setlistgame`. */

export const ECHO_OF_A_SHOW_PATH = "/archive/setlistgame"

export function getEchoOfAShowIndexUrl(): string {
  return ECHO_OF_A_SHOW_PATH
}

export function getEchoOfAShowShowUrl(showId: string): string {
  return `${ECHO_OF_A_SHOW_PATH}?id=${encodeURIComponent(showId)}`
}

export function getEchoOfAShowTourUrl(tourId: string): string {
  return `${ECHO_OF_A_SHOW_PATH}?tour_id=${encodeURIComponent(tourId)}`
}
