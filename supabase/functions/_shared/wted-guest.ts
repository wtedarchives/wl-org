/**
 * Anonymous WTED request identity.
 * Guest tokens are signed with a key derived from WYSTERIA_JWT_SECRET so they
 * cannot be swapped for a profile token, and no extra secret is required.
 */
import { SignJWT, jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"

export const WTED_REQUEST_WINDOW_MS = 60 * 60 * 1000
export const WTED_MAX_REQUESTS_PER_WINDOW = 4
export const WTED_MIN_GAP_MS = 10_000
export const WTED_MAX_REQUESTS_PER_IP_WINDOW = 12

const GUEST_AUD = "wted-guest"
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function guestSigningKey(secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("wted-guest-v1"),
  )
  return new Uint8Array(sig)
}

export async function signGuestToken(
  guestId: string,
  key: Uint8Array,
): Promise<string> {
  return await new SignJWT({ guest_id: guestId })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(GUEST_AUD)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key)
}

export async function verifyGuestToken(
  token: string,
  key: Uint8Array,
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key, { audience: GUEST_AUD })
    const id = payload.guest_id
    if (typeof id !== "string" || !UUID_RE.test(id)) return null
    return id
  } catch {
    return null
  }
}

export function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  const real = req.headers.get("x-real-ip")?.trim()
  return real || null
}

export async function hashClientIp(ip: string, secret: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${ip}:${secret}`),
  )
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
