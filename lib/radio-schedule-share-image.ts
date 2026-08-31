/**
 * Calls the schedule share-card renderer.
 *
 * The request goes to a Supabase edge function, not to Netlify directly, even
 * though Netlify is what draws the image. The gate on the render is the site's
 * own Wysteria session JWT, and verifying it needs `WYSTERIA_JWT_SECRET` —
 * which Supabase stores hashed and will not hand out, so the check has to run
 * where the secret already is. That function then forwards to Netlify with the
 * shared secret both sides already have.
 */
import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"
import type { ScheduleCardViewModel } from "@/supabase/functions/_shared/schedule-share-card/card.ts"

export type ScheduleShareImageFormat = "jpeg" | "png"

export async function fetchScheduleShareImage(
  accessToken: string | null | undefined,
  dayKey: string,
  viewModel: ScheduleCardViewModel,
  format: ScheduleShareImageFormat = "jpeg",
): Promise<{ blob: Blob | null; error: string | null }> {
  if (!accessToken) {
    return { blob: null, error: "You must be signed in." }
  }

  const base = getSupabaseFunctionsUrl()
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  if (!base.trim() || !anon.trim()) {
    return { blob: null, error: "Missing Supabase configuration." }
  }

  const url = new URL(`${base}/schedule-share-image`)
  if (format === "png") url.searchParams.set("format", "png")

  let res: Response
  try {
    res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anon}`,
        [WYSTERIA_AUTH_HEADER]: `Bearer ${accessToken}`,
        apikey: anon,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dayKey, viewModel }),
    })
  } catch (e) {
    console.error("schedule share render request failed", e)
    return { blob: null, error: "Could not reach the renderer. Try again." }
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return {
        blob: null,
        error: "Your session is not allowed to generate schedule images.",
      }
    }
    const detail = await res.text().catch(() => "")
    return { blob: null, error: `Render failed (${res.status}). ${detail.slice(0, 160)}` }
  }

  return { blob: await res.blob(), error: null }
}
