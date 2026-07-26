const STORAGE_KEY = "wted:dripfield-redirect-modal-dismissed"

export function hasDismissedDripfieldRedirectModal(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

export function dismissDripfieldRedirectModal(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, "1")
  } catch {
    // ignore quota / private mode
  }
}
