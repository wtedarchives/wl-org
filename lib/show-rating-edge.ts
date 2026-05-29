import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

export type SubmitShowRatingInput = {
  show_id: string
  rating: number
  review?: string | null
}

export type SubmitShowRatingResult =
  | {
      ok: true
      average_rating: number
      review_count: number
      user_rating: number
      user_review: string | null
    }
  | { ok: false; error: string }

export async function invokeSubmitShowRating(
  accessToken: string,
  input: SubmitShowRatingInput,
): Promise<SubmitShowRatingResult> {
  const base = getSupabaseFunctionsUrl()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!base || !anonKey) {
    return { ok: false, error: "Unable to connect. Please try again." }
  }

  const res = await fetch(`${base}/show-rating`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
      [WYSTERIA_AUTH_HEADER]: `Bearer ${accessToken}`,
      apikey: anonKey,
    },
    body: JSON.stringify(input),
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    average_rating?: number
    review_count?: number
    user_rating?: number
    user_review?: string | null
  }

  if (!res.ok) {
    return { ok: false, error: data.error ?? "Failed to save rating" }
  }

  if (
    typeof data.average_rating !== "number" ||
    typeof data.review_count !== "number" ||
    typeof data.user_rating !== "number"
  ) {
    return { ok: false, error: "Invalid response from server" }
  }

  return {
    ok: true,
    average_rating: data.average_rating,
    review_count: data.review_count,
    user_rating: data.user_rating,
    user_review: data.user_review ?? null,
  }
}
