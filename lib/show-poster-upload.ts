import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

export const SHOW_POSTERS_STORAGE_BUCKET = "show-posters"

/**
 * Upload a poster image as raw bytes via the `show-poster-upload` Edge Function.
 * Prefer this over base64-in-JSON (large payloads hang on the gateway).
 */
export async function uploadShowPosterImage(
  accessToken: string | null | undefined,
  file: File,
): Promise<{ publicUrl: string | null; path: string | null; error: string | null }> {
  if (!accessToken) {
    return { publicUrl: null, path: null, error: "You must be signed in." }
  }

  const base = getSupabaseFunctionsUrl()
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  if (!base?.trim() || !anon.trim()) {
    return { publicUrl: null, path: null, error: "Missing Supabase configuration." }
  }

  const contentType = (file.type || "image/jpeg").toLowerCase()
  const allowed = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ])
  if (!allowed.has(contentType)) {
    return {
      publicUrl: null,
      path: null,
      error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF.",
    }
  }

  const normalizedType = contentType === "image/jpg" ? "image/jpeg" : contentType
  const url = `${base}/show-poster-upload?filename=${encodeURIComponent(file.name || "poster")}`

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anon}`,
      [WYSTERIA_AUTH_HEADER]: `Bearer ${accessToken}`,
      apikey: anon,
      "Content-Type": normalizedType,
    },
    body: file,
  })

  let json: {
    data?: { path?: string; publicUrl?: string }
    error?: string
  } = {}
  try {
    json = (await res.json()) as typeof json
  } catch {
    return {
      publicUrl: null,
      path: null,
      error: res.statusText || "Invalid response",
    }
  }

  if (!res.ok) {
    return {
      publicUrl: null,
      path: null,
      error: json.error ?? `Upload failed (${res.status})`,
    }
  }

  return {
    publicUrl: json.data?.publicUrl ?? null,
    path: json.data?.path ?? null,
    error: json.data?.publicUrl ? null : "Upload did not return a URL",
  }
}
