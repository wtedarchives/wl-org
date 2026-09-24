import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

type BallotResponse = {
  submitted?: boolean
  selections?: unknown
  error?: string
}

function headers(token: string) {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(anonKey ? { apikey: anonKey } : {}),
  }
}

function endpoint() {
  const base = getSupabaseFunctionsUrl()
  if (!base || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
  return `${base}/colorado-run-vote`
}

export async function loadMyVote(token: string): Promise<{
  submitted: boolean
  selections: string[]
  error: string | null
}> {
  const url = endpoint()
  if (!url) {
    return { submitted: false, selections: [], error: "Unable to connect. Please try again." }
  }

  try {
    const res = await fetch(url, { method: "GET", headers: headers(token) })
    const body = (await res.json()) as BallotResponse
    if (!res.ok) {
      return {
        submitted: false,
        selections: [],
        error:
          res.status === 401
            ? "Your session could not be verified. Sign in again."
            : (body.error ?? "Could not load your ballot."),
      }
    }
    const selections = Array.isArray(body.selections)
      ? body.selections.filter((item): item is string => typeof item === "string")
      : []
    return { submitted: body.submitted === true, selections, error: null }
  } catch {
    return { submitted: false, selections: [], error: "Could not load your ballot." }
  }
}

export async function submitMyVote(
  token: string,
  selections: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = endpoint()
  if (!url) return { ok: false, error: "Unable to connect. Please try again." }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ selections }),
    })
    const body = (await res.json()) as BallotResponse
    if (!res.ok) {
      return {
        ok: false,
        error:
          res.status === 401
            ? "Your session could not be verified. Sign in again."
            : (body.error ?? "Could not save your ballot."),
      }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not save your ballot." }
  }
}
