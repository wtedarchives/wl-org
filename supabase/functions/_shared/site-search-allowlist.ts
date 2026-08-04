/**
 * Site-search beta allowlist — profile IDs from Edge secret `SITE_SEARCH_ALLOWLIST`
 * (comma-separated UUIDs). Never ship this list in the Next.js client.
 */
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function bearerToken(h: string | null): string | null {
  if (!h?.startsWith("Bearer ")) return null
  const t = h.slice(7).trim()
  return t !== "" ? t : null
}

export function parseSiteSearchAllowlist(
  raw: string | null | undefined,
): Set<string> {
  const ids = new Set<string>()
  if (!raw) return ids
  for (const part of raw.split(/[,\s]+/)) {
    const id = part.trim().toLowerCase()
    if (UUID_RE.test(id)) ids.add(id)
  }
  return ids
}

export type SiteSearchCaller =
  | { ok: true; profileId: string }
  | { ok: false; status: 401 | 403 | 500; error: string }

/**
 * Verify Wysteria JWT and ensure profile_id is on SITE_SEARCH_ALLOWLIST.
 */
export async function resolveSiteSearchCaller(
  req: Request,
): Promise<SiteSearchCaller> {
  const wysteria = bearerToken(req.headers.get("x-wysteria-authorization"))
  if (!wysteria) {
    return { ok: false, status: 401, error: "Unauthorized" }
  }

  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  if (!jwtSecret) {
    return { ok: false, status: 500, error: "Server configuration error" }
  }

  let profileId: string | undefined
  try {
    const { payload } = await jwtVerify(
      wysteria,
      new TextEncoder().encode(jwtSecret),
    )
    profileId =
      typeof payload.profile_id === "string" ? payload.profile_id : undefined
  } catch {
    return { ok: false, status: 401, error: "Unauthorized" }
  }

  if (!profileId || !UUID_RE.test(profileId)) {
    return { ok: false, status: 401, error: "Unauthorized" }
  }

  const allowlist = parseSiteSearchAllowlist(
    Deno.env.get("SITE_SEARCH_ALLOWLIST"),
  )
  if (allowlist.size === 0) {
    return { ok: false, status: 403, error: "Forbidden" }
  }
  if (!allowlist.has(profileId.toLowerCase())) {
    return { ok: false, status: 403, error: "Forbidden" }
  }

  return { ok: true, profileId }
}
