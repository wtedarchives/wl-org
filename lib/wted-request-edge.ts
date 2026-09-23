import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"
import type { WtedRequestEnriched } from "@/types/wted"

/** Must match `supabase/functions/_shared/cors.ts` allow-headers. */
export const WTED_GUEST_AUTH_HEADER = "x-wted-guest-authorization"

const GUEST_TOKEN_STORAGE_KEY = "wted-guest-request-token"

export function readWtedGuestToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    const token = localStorage.getItem(GUEST_TOKEN_STORAGE_KEY)?.trim()
    return token ? token : null
  } catch {
    return null
  }
}

export function writeWtedGuestToken(token: string): void {
  try {
    localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, token)
  } catch {
    // Private mode or a full store: the request still succeeded server-side.
  }
}

export function clearWtedGuestToken(): void {
  try {
    localStorage.removeItem(GUEST_TOKEN_STORAGE_KEY)
  } catch {
    // ignore
  }
}

function anonHeaders(): Record<string, string> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  if (!anonKey) {
    throw new Error("Missing Supabase anon key.")
  }
  return {
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  }
}

function requestHeaders(accessToken: string | null): Record<string, string> {
  const headers = anonHeaders()
  if (accessToken) {
    headers[WYSTERIA_AUTH_HEADER] = `Bearer ${accessToken}`
    return headers
  }
  const guest = readWtedGuestToken()
  if (guest) headers[WTED_GUEST_AUTH_HEADER] = `Bearer ${guest}`
  return headers
}

function functionsBase(): string {
  const base = getSupabaseFunctionsUrl()
  if (!base) throw new Error("Missing Supabase URL.")
  return base
}

function rememberGuestToken(data: { guestToken?: unknown }): void {
  if (typeof data.guestToken === "string" && data.guestToken.trim() !== "") {
    writeWtedGuestToken(data.guestToken.trim())
  }
}

export async function fetchWtedRequests(
  accessToken: string | null,
): Promise<WtedRequestEnriched[]> {
  const res = await fetch(`${functionsBase()}/wted-requests`, {
    headers: requestHeaders(accessToken),
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    requests?: WtedRequestEnriched[]
  }

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to fetch requests")
  }

  return data.requests ?? []
}

/**
 * Move this browser's recent guest requests onto the signed-in profile.
 * Clears the stored guest token after a successful merge or an invalid token.
 */
export async function mergeWtedGuestRequests(accessToken: string): Promise<void> {
  const guest = readWtedGuestToken()
  if (!guest) return

  const headers = anonHeaders()
  headers[WYSTERIA_AUTH_HEADER] = `Bearer ${accessToken}`
  headers[WTED_GUEST_AUTH_HEADER] = `Bearer ${guest}`

  const res = await fetch(`${functionsBase()}/wted-requests`, {
    method: "POST",
    headers,
  })

  if (res.status === 401) {
    clearWtedGuestToken()
    return
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? "Failed to merge requests")
  }

  clearWtedGuestToken()
}

export async function submitWtedRequest(
  accessToken: string | null,
  radioId: string,
): Promise<void> {
  const res = await fetch(`${functionsBase()}/wted-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...requestHeaders(accessToken),
    },
    body: JSON.stringify({ radio_id: radioId }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    guestToken?: unknown
  }
  rememberGuestToken(data)

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to submit request")
  }
}
