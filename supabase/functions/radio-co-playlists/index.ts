import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { getRadioCoSessionCookie, RADIO_CO_STUDIO_API_V1 } from "../_shared/radio-co-session.ts"

const STATION_ID = "s3c11c85d6"
const STUDIO_PLAYLISTS_URL = `${RADIO_CO_STUDIO_API_V1}/stations/${STATION_ID}/playlists`

/** Studio requires a hex colour; matches the Playlist schema pattern. */
const COLOUR_PATTERN = /^#[a-fA-F0-9]{6}$/
const DEFAULT_COLOUR = "#51cf66"
/** Station branding used for Radio.co's now-playing metadata when unset locally. */
const DEFAULT_METADATA_ARTIST = "WTED Goose Radio"

/** Direct Studio manipulation — admins only. `publish` is handled separately. */
const ADMIN_ACTIONS = new Set(["list", "get", "create", "update", "addTracks", "delete"])

type PlaylistItem = { position?: number; type: string; track_id: number }

type Playlist = {
  id: number
  name: string
  colour: string
  position: number
  num_items: number
  resume: boolean
  default: boolean
  metadata: { artist: string; title: string } | null
  artwork: unknown
  /** Only present on the single-playlist endpoint, not on the collection. */
  items?: PlaylistItem[]
}

/** Single-playlist reads/writes return the playlist plus its expanded tracks and tags. */
type PlaylistEnvelope = {
  playlists?: unknown
  tracks?: unknown
  tags?: unknown
}

class StudioError extends Error {
  status: number
  constructor(status: number, detail: string) {
    super(`Radio.co studio returned ${status}: ${detail}`)
    this.status = status
  }
}

function err(message: string, status: number, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function bearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null
  return header.slice(7).trim() || null
}

async function studioFetch(
  url: string,
  cookie: string,
  init?: { method?: string; body?: unknown },
): Promise<PlaylistEnvelope> {
  const headers: Record<string, string> = { Cookie: cookie, Accept: "application/json" }
  if (init?.body !== undefined) headers["Content-Type"] = "application/json"

  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers,
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  })

  if (!res.ok) throw new StudioError(res.status, (await res.text()).slice(0, 500))

  // DELETE returns an empty body; don't try to parse it as JSON.
  const text = await res.text()
  if (!text.trim()) return {}
  try {
    return JSON.parse(text) as PlaylistEnvelope
  } catch {
    throw new StudioError(res.status, "response was not valid JSON")
  }
}

function firstPlaylist(envelope: PlaylistEnvelope): Playlist {
  if (!Array.isArray(envelope.playlists) || envelope.playlists.length === 0) {
    throw new Error("Invalid Radio.co response: missing playlists")
  }
  return envelope.playlists[0] as Playlist
}

/** Studio writes items without `position` — the server assigns it from array order. */
function toWriteItems(items: PlaylistItem[]): Array<{ type: string; track_id: number }> {
  return items.map((item) => ({ type: item.type ?? "track", track_id: item.track_id }))
}

function parseTrackIds(raw: unknown, field: string): number[] {
  if (!Array.isArray(raw)) throw new Error(`\`${field}\` must be an array`)
  return raw.map((value) => {
    const id = typeof value === "number" ? value : Number(value)
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`\`${field}\` must contain positive integer track ids`)
    }
    return id
  })
}

type PlaylistChanges = {
  name?: string
  colour?: string
  resume?: boolean
  metadata?: { artist: string; title: string }
  items?: Array<{ type: string; track_id: number }>
}

/**
 * Studio's UI always sends the same five `replace` ops together, so mirror that
 * exactly rather than sending a minimal patch — unsent paths are unverified
 * territory. Values default to current server state for anything not changing.
 */
function buildPatch(current: Playlist, changes: PlaylistChanges) {
  const items = changes.items ?? toWriteItems(current.items ?? [])
  const metadata = changes.metadata ?? {
    artist: current.metadata?.artist ?? "",
    title: current.metadata?.title ?? current.name,
  }

  return [
    { op: "replace", path: "/items", value: items },
    { op: "replace", path: "/metadata", value: metadata },
    { op: "replace", path: "/name", value: changes.name ?? current.name },
    { op: "replace", path: "/colour", value: changes.colour ?? current.colour },
    { op: "replace", path: "/resume", value: changes.resume ?? current.resume },
  ]
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders })
    }

    if (req.method !== "GET" && req.method !== "POST") {
      return err("Method not allowed", 405)
    }

    /**
     * Wysteria SSO JWT. Newer callers send it in `x-wysteria-authorization` (leaving
     * `authorization` for the Supabase anon key); the original GET callers put it in
     * `authorization`, so fall back to that.
     */
    const token = bearerToken(req.headers.get("x-wysteria-authorization"))
      ?? bearerToken(req.headers.get("authorization"))
    if (!token) return err("Unauthorized", 401)

    const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
    const radioEmail = Deno.env.get("RADIO_CO_EMAIL")?.trim()
    const radioPassword = Deno.env.get("RADIO_CO_PASSWORD")?.trim()

    const missing: string[] = []
    if (!jwtSecret) missing.push("WYSTERIA_JWT_SECRET")
    if (!radioEmail) missing.push("RADIO_CO_EMAIL")
    if (!radioPassword) missing.push("RADIO_CO_PASSWORD")
    if (missing.length > 0) return err("Server configuration error", 500, { missing_env: missing })

    let jwtPayload: Record<string, unknown>
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret!))
      jwtPayload = payload as Record<string, unknown>
    } catch {
      return err("Unauthorized", 401)
    }

    const isAdmin = Boolean(jwtPayload.is_admin)
    const profileId = typeof jwtPayload.profile_id === "string" ? jwtPayload.profile_id : null

    let body: Record<string, unknown> = {}
    if (req.method === "POST") {
      try {
        body = await req.json()
      } catch {
        return err("Invalid request body", 400)
      }
    }

    const action = req.method === "GET" ? "list" : (body.action as string | undefined) ?? "create"

    if (ADMIN_ACTIONS.has(action) && !isAdmin) return err("Forbidden", 403)

    // Validate everything that doesn't need Studio before spending a login round-trip.
    let playlistId = 0
    if (action === "get" || action === "update" || action === "addTracks" || action === "delete") {
      playlistId = typeof body.id === "number" ? body.id : Number(body.id)
      if (!Number.isInteger(playlistId) || playlistId <= 0) {
        return err("`id` is required", 400)
      }
    }

    const playlistUrl = (id: number) => `${STUDIO_PLAYLISTS_URL}/${id}`

    // ─── action: publish ──────────────────────────────────────────────────────
    // Pushes a local wted_user_playlists row to Radio.co. Creates the Studio
    // playlist on first publish, updates it thereafter. Owner or admin only.

    if (action === "publish") {
      const localId = typeof body.playlist_id === "string" ? body.playlist_id.trim() : ""
      if (!localId) return err("`playlist_id` is required", 400)

      const supabaseUrl = Deno.env.get("SUPABASE_URL")
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
      if (!supabaseUrl || !serviceKey) return err("Server configuration error", 500)

      const db = createClient(supabaseUrl, serviceKey)

      const { data: local, error: loadError } = await db
        .from("wted_user_playlists")
        .select("id, profile_id, name, colour, metadata_artist, metadata_title, radio_co_playlist_id")
        .eq("id", localId)
        .maybeSingle()

      if (loadError) return err("Failed to load playlist", 500, { detail: loadError.message })
      if (!local) return err("Playlist not found", 404)
      if (!isAdmin && local.profile_id !== profileId) return err("Forbidden", 403)

      const { data: itemRows, error: itemsError } = await db
        .from("wted_user_playlist_items")
        .select("radio_id, position")
        .eq("playlist_id", localId)
        .order("position", { ascending: true })

      if (itemsError) return err("Failed to load playlist items", 500, { detail: itemsError.message })

      // radio_id is Radio.co's track id stored as text; Studio wants integers.
      const trackIds: number[] = []
      for (const row of itemRows ?? []) {
        const id = Number(row.radio_id)
        if (!Number.isInteger(id) || id <= 0) {
          return err(`Playlist contains an unusable radio_id: ${row.radio_id}`, 422)
        }
        trackIds.push(id)
      }

      const name = local.name
      const colour = COLOUR_PATTERN.test(local.colour ?? "") ? local.colour : DEFAULT_COLOUR
      const artist = local.metadata_artist?.trim() || DEFAULT_METADATA_ARTIST
      const title = local.metadata_title?.trim() || name

      let radioCookie: string
      try {
        radioCookie = await getRadioCoSessionCookie()
      } catch (e) {
        return err("Failed to authenticate with Radio.co", 502, {
          message: e instanceof Error ? e.message : String(e),
        })
      }

      const createOnStudio = async () => {
        const created = firstPlaylist(
          await studioFetch(STUDIO_PLAYLISTS_URL, radioCookie, {
            method: "POST",
            body: { name, colour, artist, title },
          }),
        )
        if (trackIds.length === 0) return created
        return firstPlaylist(
          await studioFetch(playlistUrl(created.id), radioCookie, {
            method: "PATCH",
            body: buildPatch(created, {
              items: trackIds.map((id) => ({ type: "track", track_id: id })),
            }),
          }),
        )
      }

      let published: Playlist
      try {
        if (!local.radio_co_playlist_id) {
          published = await createOnStudio()
        } else {
          try {
            const current = firstPlaylist(
              await studioFetch(playlistUrl(local.radio_co_playlist_id), radioCookie),
            )
            published = firstPlaylist(
              await studioFetch(playlistUrl(local.radio_co_playlist_id), radioCookie, {
                method: "PATCH",
                body: buildPatch(current, {
                  name,
                  colour,
                  metadata: { artist, title },
                  items: trackIds.map((id) => ({ type: "track", track_id: id })),
                }),
              }),
            )
          } catch (e) {
            // Deleted upstream in Studio — recreate rather than failing the publish.
            if (e instanceof StudioError && e.status === 404) {
              published = await createOnStudio()
            } else {
              throw e
            }
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        await db
          .from("wted_user_playlists")
          .update({ publish_error: message.slice(0, 500), updated_at: new Date().toISOString() })
          .eq("id", localId)
        return err("Failed to publish to Radio.co", 502, { detail: message })
      }

      const { error: saveError } = await db
        .from("wted_user_playlists")
        .update({
          radio_co_playlist_id: published.id,
          published_at: new Date().toISOString(),
          publish_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", localId)

      if (saveError) {
        // Studio is updated but we lost the link — surface loudly, it needs manual repair.
        return err("Published to Radio.co but failed to record the result", 500, {
          detail: saveError.message,
          radio_co_playlist_id: published.id,
        })
      }

      return ok({ playlist: published, radio_co_playlist_id: published.id })
    }

    let radioCookie: string
    try {
      radioCookie = await getRadioCoSessionCookie()
    } catch (e) {
      return err("Failed to authenticate with Radio.co", 502, {
        message: e instanceof Error ? e.message : String(e),
      })
    }

    // ─── action: list ─────────────────────────────────────────────────────────
    // Collection endpoint — note these playlists have no `items`.

    if (action === "list") {
      const envelope = await studioFetch(STUDIO_PLAYLISTS_URL, radioCookie)
      if (!Array.isArray(envelope.playlists)) {
        return err("Invalid Radio.co response: missing playlists", 502)
      }
      return ok({ playlists: envelope.playlists })
    }

    // ─── action: get ──────────────────────────────────────────────────────────
    // Single playlist, including `items` and expanded `tracks`.

    if (action === "get") {
      const envelope = await studioFetch(playlistUrl(playlistId), radioCookie)
      return ok({
        playlist: firstPlaylist(envelope),
        tracks: envelope.tracks ?? [],
        tags: envelope.tags ?? [],
      })
    }

    // ─── action: create ───────────────────────────────────────────────────────
    // Create takes `artist`/`title` FLAT, unlike update which nests them under
    // `/metadata`. Do not "fix" this to match the read shape.

    if (action === "create") {
      const name = typeof body.name === "string" ? body.name.trim() : ""
      if (!name) return err("`name` is required", 400)

      const colour = typeof body.colour === "string" && body.colour.trim()
        ? body.colour.trim()
        : DEFAULT_COLOUR
      if (!COLOUR_PATTERN.test(colour)) {
        return err("`colour` must be a hex value like #51cf66", 400)
      }

      const artist = typeof body.artist === "string" ? body.artist.trim() : ""
      if (!artist) return err("`artist` is required", 400)

      const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : name

      const created = firstPlaylist(
        await studioFetch(STUDIO_PLAYLISTS_URL, radioCookie, {
          method: "POST",
          body: { name, colour, artist, title },
        }),
      )

      let trackIds: number[] = []
      try {
        if (body.trackIds !== undefined) trackIds = parseTrackIds(body.trackIds, "trackIds")
      } catch (e) {
        return err(e instanceof Error ? e.message : "Invalid trackIds", 400)
      }

      if (trackIds.length === 0) return ok({ playlist: created })

      const seeded = firstPlaylist(
        await studioFetch(playlistUrl(created.id), radioCookie, {
          method: "PATCH",
          body: buildPatch(created, {
            items: trackIds.map((id) => ({ type: "track", track_id: id })),
          }),
        }),
      )
      return ok({ playlist: seeded })
    }

    // ─── action: update / addTracks ───────────────────────────────────────────
    // Studio uses RFC 6902 JSON Patch. Critically, `/items` is a whole-array
    // REPLACE — there is no append op — so both paths read current state first.

    if (action === "update" || action === "addTracks") {
      const current = firstPlaylist(await studioFetch(playlistUrl(playlistId), radioCookie))

      const changes: PlaylistChanges = {}

      if (body.name !== undefined) {
        const name = typeof body.name === "string" ? body.name.trim() : ""
        if (!name) return err("`name` cannot be empty", 400)
        changes.name = name
      }

      if (body.colour !== undefined) {
        const colour = String(body.colour).trim()
        if (!COLOUR_PATTERN.test(colour)) {
          return err("`colour` must be a hex value like #51cf66", 400)
        }
        changes.colour = colour
      }

      if (body.artist !== undefined || body.title !== undefined) {
        changes.metadata = {
          artist: body.artist !== undefined
            ? String(body.artist).trim()
            : current.metadata?.artist ?? "",
          title: body.title !== undefined
            ? String(body.title).trim()
            : current.metadata?.title ?? current.name,
        }
      }

      if (typeof body.resume === "boolean") changes.resume = body.resume

      try {
        if (action === "addTracks") {
          const trackIds = parseTrackIds(body.trackIds, "trackIds")
          if (trackIds.length === 0) return err("`trackIds` cannot be empty", 400)
          const existing = current.items ?? []
          const seen = new Set(existing.map((item) => item.track_id))
          const additions = trackIds
            .filter((id) => !seen.has(id))
            .map((id) => ({ type: "track", track_id: id }))
          changes.items = [...toWriteItems(existing), ...additions]
        } else if (body.trackIds !== undefined) {
          // update: `trackIds` replaces the whole list, in the order given.
          changes.items = parseTrackIds(body.trackIds, "trackIds")
            .map((id) => ({ type: "track", track_id: id }))
        }
      } catch (e) {
        return err(e instanceof Error ? e.message : "Invalid trackIds", 400)
      }

      if (Object.keys(changes).length === 0) return err("No changes supplied", 400)

      const updated = firstPlaylist(
        await studioFetch(playlistUrl(playlistId), radioCookie, {
          method: "PATCH",
          body: buildPatch(current, changes),
        }),
      )
      return ok({ playlist: updated })
    }

    // ─── action: delete ───────────────────────────────────────────────────────
    // Studio returns an empty body here, so there is nothing to echo back.

    if (action === "delete") {
      await studioFetch(playlistUrl(playlistId), radioCookie, { method: "DELETE" })
      return ok({ deleted: playlistId })
    }

    return err(`Unknown action: ${action}`, 400)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    // Studio failures are surfaced as 502 so callers can distinguish them from bugs.
    if (e instanceof StudioError || message.startsWith("Invalid Radio.co")) {
      return err("Radio.co studio request failed", 502, { detail: message })
    }
    return err("Unhandled function error", 500, { message })
  }
})
