import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"
import type { WtedRequestEnriched } from "@/types/wted"

function wtedAuthHeaders(accessToken: string): Record<string, string> {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  if (!anonKey) {
    throw new Error("Missing Supabase anon key.")
  }
  return {
    Authorization: `Bearer ${anonKey}`,
    [WYSTERIA_AUTH_HEADER]: `Bearer ${accessToken}`,
    apikey: anonKey,
  }
}

export async function fetchWtedRequests(
  accessToken: string,
): Promise<WtedRequestEnriched[]> {
  const base = getSupabaseFunctionsUrl()
  if (!base) {
    throw new Error("Missing Supabase URL.")
  }

  const res = await fetch(`${base}/wted-requests`, {
    headers: wtedAuthHeaders(accessToken),
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

export async function submitWtedRequest(
  accessToken: string,
  radioId: string,
): Promise<void> {
  const base = getSupabaseFunctionsUrl()
  if (!base) {
    throw new Error("Missing Supabase URL.")
  }

  const res = await fetch(`${base}/wted-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...wtedAuthHeaders(accessToken),
    },
    body: JSON.stringify({ radio_id: radioId }),
  })

  const data = (await res.json().catch(() => ({}))) as { error?: string }

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to submit request")
  }
}
