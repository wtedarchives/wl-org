import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

export const RADIO_SCHEDULES_STORAGE_BUCKET = "radio-schedules"

export function radioScheduleShareStoragePath(dayKey: string, filename: string): string {
  return `${dayKey}/${filename}`
}

export async function uploadRadioScheduleSharePng(
  accessToken: string | null | undefined,
  storagePath: string,
  pngBlob: Blob,
): Promise<{ publicUrl: string | null; path: string | null; error: string | null }> {
  if (!accessToken) {
    return { publicUrl: null, path: null, error: "You must be signed in." }
  }

  const base = getSupabaseFunctionsUrl()
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  if (!base?.trim() || !anon.trim()) {
    return { publicUrl: null, path: null, error: "Missing Supabase configuration." }
  }

  const url = `${base}/radio-schedule-share-upload?path=${encodeURIComponent(storagePath)}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anon}`,
      [WYSTERIA_AUTH_HEADER]: `Bearer ${accessToken}`,
      apikey: anon,
      "Content-Type": "image/png",
    },
    body: pngBlob,
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
    path: json.data?.path ?? storagePath,
    error: null,
  }
}
