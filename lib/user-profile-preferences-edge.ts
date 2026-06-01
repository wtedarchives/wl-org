import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import type { PushSubscriptionPayload } from "@/lib/push-notifications"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

export type UserProfilePreferencesPatch = {
  setlist_combined_rows_expanded_by_default?: boolean
  push_notifications_enabled?: boolean
  push_subscription?: PushSubscriptionPayload | null
}

export type UserProfilePreferencesResult =
  | {
      ok: true
      setlist_combined_rows_expanded_by_default?: boolean
      push_notifications_enabled?: boolean
    }
  | { ok: false; error: string }

export async function invokeUserProfilePreferences(
  accessToken: string,
  patch: UserProfilePreferencesPatch,
): Promise<UserProfilePreferencesResult> {
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

  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    setlist_combined_rows_expanded_by_default?: boolean
    push_notifications_enabled?: boolean
  }

  if (!res.ok) {
    return { ok: false, error: data.error ?? "Failed to save preferences" }
  }

  return {
    ok: true,
    setlist_combined_rows_expanded_by_default:
      data.setlist_combined_rows_expanded_by_default,
    push_notifications_enabled: data.push_notifications_enabled,
  }
}
