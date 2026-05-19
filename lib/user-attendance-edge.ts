import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

export type UserAttendanceAction = "add" | "remove"

export async function invokeUserAttendance(
  accessToken: string,
  action: UserAttendanceAction,
  showId: string,
): Promise<void> {
  const base = getSupabaseFunctionsUrl()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!base || !anonKey) {
    throw new Error("Unable to connect. Please try again.")
  }

  const res = await fetch(`${base}/user-attendance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      [WYSTERIA_AUTH_HEADER]: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ action, show_id: showId }),
  })

  const data = (await res.json().catch(() => ({}))) as { error?: string }

  if (!res.ok) {
    throw new Error(data.error ?? "Failed to update attendance")
  }
}
