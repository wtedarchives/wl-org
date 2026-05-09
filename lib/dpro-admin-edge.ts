/**
 * Client calls for the `dpro-admin` Edge Function (service-role mutations after
 * Wysteria JWT + is_admin verification). Use for admin panel writes when RLS expects
 * Supabase Auth but the app uses SSO JWT only.
 */

import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

export async function invokeDproAdmin<T = unknown>(
  accessToken: string | null | undefined,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  if (!accessToken) {
    return { data: null, error: "You must be signed in." }
  }
  const base = getSupabaseFunctionsUrl()
  if (!base) {
    return { data: null, error: "Missing Supabase URL." }
  }
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  const res = await fetch(`${base}/dpro-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(anon ? { apikey: anon } : {}),
    },
    body: JSON.stringify(body),
  })

  let json: { data?: T; error?: string } = {}
  try {
    json = (await res.json()) as { data?: T; error?: string }
  } catch {
    return { data: null, error: res.statusText || "Invalid response" }
  }

  if (!res.ok) {
    return {
      data: null,
      error: json.error ?? `Request failed (${res.status})`,
    }
  }
  if (json.error) {
    return { data: null, error: json.error }
  }
  return { data: (json.data ?? null) as T, error: null }
}
