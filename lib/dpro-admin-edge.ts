/**
 * Client calls for the `dpro-admin` Edge Function (service-role mutations after
 * Wysteria JWT + is_admin verification). Use for admin panel writes when RLS expects
 * Supabase Auth but the app uses SSO JWT only.
 *
 * Supabase’s Edge gateway validates `Authorization: Bearer …` against project JWTs.
 * Custom Wysteria tokens there trigger **UNAUTHORIZED_LEGACY_JWT**. We therefore send
 * the **anon JWT** as `Authorization` and pass Wysteria in `x-wysteria-authorization`.
 */

import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

/** Must match `supabase/functions/_shared/cors.ts` `Access-Control-Allow-Headers`. */
const WYSTERIA_AUTH_HEADER = "x-wysteria-authorization"

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
  if (!anon) {
    return { data: null, error: "Missing Supabase anon key." }
  }
  const res = await fetch(`${base}/dpro-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anon}`,
      [WYSTERIA_AUTH_HEADER]: `Bearer ${accessToken}`,
      apikey: anon,
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
