const STORAGE_KEY = "wl-home-v2-welcome-modal-v1"

type WelcomeModalStored =
  | { status: "dismissed" }
  | { status: "muted"; until: number }

const DAY_MS = 24 * 60 * 60 * 1000

function readStored(): WelcomeModalStored | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WelcomeModalStored
    if (parsed?.status === "dismissed") return { status: "dismissed" }
    if (
      parsed?.status === "muted" &&
      typeof parsed.until === "number" &&
      Number.isFinite(parsed.until)
    ) {
      return { status: "muted", until: parsed.until }
    }
    return null
  } catch {
    return null
  }
}

function writeStored(value: WelcomeModalStored) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // ignore quota / private mode
  }
}

/** Whether the homepage welcome modal should open for this visit. */
export function shouldShowWelcomeModal(): boolean {
  const stored = readStored()
  if (!stored) return true
  if (stored.status === "dismissed") return false
  return Date.now() >= stored.until
}

/** Close for ~24 hours, then show again. */
export function muteWelcomeModalForOneDay() {
  writeStored({ status: "muted", until: Date.now() + DAY_MS })
}

/** Never show the welcome modal again on this browser. */
export function dismissWelcomeModalPermanently() {
  writeStored({ status: "dismissed" })
}
