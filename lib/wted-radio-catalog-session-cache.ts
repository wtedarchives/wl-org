import type { WtedRadioIdRow } from "@/lib/wted-radio-ids-sync"

const SESSION_KEY = "wl_wted_radio_catalog_v1"

function isCatalogRow(x: unknown): x is WtedRadioIdRow {
  if (!x || typeof x !== "object") return false
  const r = x as Record<string, unknown>
  return typeof r.uuid === "string" && typeof r.radio_id === "string"
}

export function readWtedRadioCatalogSessionCache(): WtedRadioIdRow[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    if (!parsed.every(isCatalogRow)) return null
    return parsed
  } catch {
    return null
  }
}

export function writeWtedRadioCatalogSessionCache(rows: WtedRadioIdRow[]): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(rows))
  } catch {
    // Quota, private mode, etc.
  }
}

export function clearWtedRadioCatalogSessionCache(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}
