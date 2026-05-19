import { WYSTERIA_AUTH_HEADER } from "@/lib/dpro-admin-edge"
import { downloadOrWebSharePng } from "@/lib/wl-home-v2-share-image-download"
import { getSupabaseFunctionsUrl } from "@/lib/supabase-functions"

export const SETLIST_IMAGES_STORAGE_BUCKET = "setlist-images"

/**
 * Storage path: `{show_id}/{show_id}.png` or `{show_id}/{show_id}_cn.png` when entry coach notes are included.
 */
export function setlistShareStoragePath(
  showId: string,
  withEntryCoachNotes: boolean,
): string {
  const id = showId.trim()
  const filename = withEntryCoachNotes ? `${id}_cn.png` : `${id}.png`
  return `${id}/${filename}`
}

export function getSetlistSharePublicUrl(
  showId: string,
  withEntryCoachNotes: boolean,
): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!base) return null
  const path = setlistShareStoragePath(showId, withEntryCoachNotes)
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${SETLIST_IMAGES_STORAGE_BUCKET}/${path}`
}

/** HEAD request against the public object URL. */
export async function setlistShareImageExistsInStorage(
  showId: string,
  withEntryCoachNotes: boolean,
): Promise<boolean> {
  const url = getSetlistSharePublicUrl(showId, withEntryCoachNotes)
  if (!url) return false
  try {
    const res = await fetch(url, { method: "HEAD" })
    return res.ok
  } catch {
    return false
  }
}

export async function uploadSetlistSharePng(
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

  const url = `${base}/setlist-share-upload?path=${encodeURIComponent(storagePath)}`
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

export async function downloadSetlistShareFromStorage(
  showId: string,
  withEntryCoachNotes: boolean,
  downloadFilename: string,
  options?: { shareTitle?: string },
): Promise<{
  error: string | null
  delivery?: "shared" | "downloaded"
}> {
  const url = getSetlistSharePublicUrl(showId, withEntryCoachNotes)
  if (!url) return { error: "Missing Supabase configuration." }

  try {
    const res = await fetch(url)
    if (!res.ok) return { error: "Image not found in storage." }
    const blob = await res.blob()
    const delivery = await downloadOrWebSharePng(blob, downloadFilename, {
      shareTitle: options?.shareTitle ?? downloadFilename,
    })
    return { error: null, delivery }
  } catch (e) {
    console.error(e)
    return { error: "Could not download image." }
  }
}
