import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

export type UserProfilePreferencesPatch = {
  setlist_combined_rows_expanded_by_default: boolean
}

export async function invokeUserProfilePreferences(
  accessToken: string,
  patch: UserProfilePreferencesPatch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = getSupabaseFunctionsUrl()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!base || !anonKey) {
    return { ok: false, error: "Unable to connect. Please try again." }
  }

  const res = await fetch(`${base}/user-profile-preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      [WYSTERIA_AUTH_HEADER]: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
    body: JSON.stringify(patch),
  })

  const data = (await res.json().catch(() => ({}))) as { error?: string }

  if (!res.ok) {
    return { ok: false, error: data.error ?? "Failed to save preferences" }
  }

  return { ok: true }
}
