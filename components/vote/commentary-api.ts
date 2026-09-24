import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

type CommentaryResponse = {
  submitted?: boolean
  playbackUrl?: string
  durationSeconds?: number
  error?: string
}

function authHeaders(token: string) {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return {
    Authorization: `Bearer ${token}`,
    ...(anonKey ? { apikey: anonKey } : {}),
  }
}

function endpoint() {
  const base = getSupabaseFunctionsUrl()
  if (!base || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
  return `${base}/colorado-run-commentary`
}

function sessionError(status: number, fallback: string, bodyError?: string) {
  if (status === 401) return "Your session could not be verified. Sign in again."
  return bodyError ?? fallback
}

export async function loadMyCommentary(token: string): Promise<{
  submitted: boolean
  playbackUrl: string | null
  error: string | null
}> {
  const url = endpoint()
  if (!url) {
    return { submitted: false, playbackUrl: null, error: "Unable to connect. Please try again." }
  }

  try {
    const res = await fetch(url, { method: "GET", headers: authHeaders(token) })
    const body = (await res.json()) as CommentaryResponse
    if (!res.ok) {
      return {
        submitted: false,
        playbackUrl: null,
        error: sessionError(res.status, "Could not load your commentary.", body.error),
      }
    }
    return {
      submitted: body.submitted === true,
      playbackUrl: typeof body.playbackUrl === "string" ? body.playbackUrl : null,
      error: null,
    }
  } catch {
    return { submitted: false, playbackUrl: null, error: "Could not load your commentary." }
  }
}

export async function submitCommentary(
  token: string,
  blob: Blob,
  durationSeconds: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = endpoint()
  if (!url) return { ok: false, error: "Unable to connect. Please try again." }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeaders(token),
        "Content-Type": blob.type || "audio/webm",
        "X-Duration-Seconds": String(durationSeconds),
      },
      body: blob,
    })
    const body = (await res.json()) as CommentaryResponse
    if (!res.ok) {
      return { ok: false, error: sessionError(res.status, "Could not save your commentary.", body.error) }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: "Could not save your commentary." }
  }
}
