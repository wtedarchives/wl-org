"use client"

import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

/** Matches server-side allowlist checks on `schedule-share-image-proxy`. */
function normalizeScheduleShareArtworkUrl(raw: string): string | null {
  let s = raw.trim()
  if (!s || s.startsWith("/")) return null
  if (s.startsWith("//")) s = `https:${s}`
  try {
    const u = new URL(s)
    if (u.protocol === "http:") u.protocol = "https:"
    if (u.protocol !== "https:") return null
    return u.toString()
  } catch {
    return null
  }
}

/**
 * Cross-origin artwork needs fetch-through-proxy → blob URL so `<img>` works with canvas export on mobile Safari.
 * Same-origin absolute URLs and relative `/path` assets skip the proxy.
 */
export function scheduleShareExportImageNeedsProxy(src: string): boolean {
  if (typeof window === "undefined") return false
  const abs = normalizeScheduleShareArtworkUrl(src)
  if (!abs) return false
  try {
    return new URL(abs).origin !== window.location.origin
  } catch {
    return false
  }
}

const resolvedCache = new Map<string, string>()
const inflight = new Map<string, Promise<string>>()

/**
 * Returns a `blob:` URL for cross-origin schedule artwork (cached per normalized URL for the session).
 */
export async function getScheduleShareProxiedBlobUrl(
  originalSrc: string,
): Promise<string> {
  const abs = normalizeScheduleShareArtworkUrl(originalSrc)
  if (!abs) {
    throw new Error("Schedule share proxy: invalid URL or relative path")
  }

  const cached = resolvedCache.get(abs)
  if (cached) return cached

  let p = inflight.get(abs)
  if (!p) {
    p = (async () => {
      const base = getSupabaseFunctionsUrl()
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!base?.trim() || !anon?.trim()) {
        throw new Error(
          "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing",
        )
      }
      const proxyUrl = `${base}/schedule-share-image-proxy?url=${encodeURIComponent(abs)}`
      const res = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => "")
        throw new Error(
          `Image proxy HTTP ${res.status}: ${errText.slice(0, 200)}`,
        )
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      resolvedCache.set(abs, url)
      return url
    })()
    p = p.finally(() => {
      inflight.delete(abs)
    })
    inflight.set(abs, p)
  }

  return p
}
