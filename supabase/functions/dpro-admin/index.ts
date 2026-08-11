import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"
import { jwtVerify } from "https://deno.land/x/jose@v4.15.5/index.ts"
import { corsHeaders } from "../_shared/cors.ts"
import {
  crawlStudioTracksChunk,
  insertStudioTracks,
  reconcileWtedRadioIds,
  WTED_RADIO_CO_STUDIO_CHUNK_PAGES,
} from "../_shared/wted-radio-ids-sync.ts"
import { getRadioCoSessionCookie } from "../_shared/radio-co-session.ts"
import {
  BRAINS_DISCOURSE_ONSTAGE_CHANNEL_ID,
  buildSetlistNowPlayingDiscourseMessage,
  buildSetlistShowEventDiscourseMessage,
  isSetlistDiscourseShowEvent,
  postBrainsDiscourseChatMessage,
} from "../_shared/discourse-brains-chat.ts"
import {
  buildSetlistNowPlayingPushNotification,
  buildSetlistShowEventPushNotification,
  resolveSongCategoryArtwork,
  sendSetlistPushNotifications,
} from "../_shared/setlist-push-notifications.ts"
import {
  postSetlistShowEventToBluesky,
  postSetlistSongToBluesky,
} from "../_shared/bluesky-setlist-post.ts"
import { postSetlistToInstagram } from "../_shared/instagram-setlist-post.ts"
import { scoreSetlistGameShow } from "../_shared/setlist-game-scoring.ts"

function httpErr(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function jsonOk(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function pick(row: Record<string, unknown>, keys: string[]) {
  const o: Record<string, unknown> = {}
  for (const k of keys) {
    if (k in row && row[k] !== undefined) o[k] = row[k]
  }
  return o
}

async function handleAction(
  db: SupabaseClient,
  action: string,
  body: Record<string, unknown>,
): Promise<{ data?: unknown; error?: string }> {
  switch (action) {
    case "rpc_update_all_setlist_entries": {
      const { error } = await db.rpc("update_all_setlist_entries")
      if (error) return { error: error.message }
      return { data: true }
    }

    case "setlist_entries_insert": {
      const row = body.row as Record<string, unknown> | undefined
      if (!row || typeof row.entry_show !== "string") return { error: "Invalid row" }
      const allowed = pick(row, [
        "entry_set",
        "entry_setnum",
        "entry_song",
        "entry_show",
        "entry_new",
        "entry_short",
        "entry_segue",
        "entry_length",
        "entry_placement",
        "entry_coachnotes",
      ])
      const { data, error } = await db.from("setlist_entries").insert(allowed).select()
      if (error) return { error: error.message }
      return { data: { rows: data } }
    }

    case "setlist_entries_update": {
      const entry_id = body.entry_id as string | undefined
      const patch = body.patch as Record<string, unknown> | undefined
      if (!entry_id || !patch) return { error: "Invalid payload" }
      const allowed = pick(patch, [
        "entry_set",
        "entry_setnum",
        "entry_song",
        "entry_short",
        "entry_segue",
        "entry_length",
        "entry_placement",
        "entry_coachnotes",
        "entry_new",
        "radio_id",
      ])
      const { error } = await db.from("setlist_entries").update(allowed).eq("entry_id", entry_id)
      if (error) return { error: error.message }
      // When a radio_id was assigned, keep wted_radio_ids.show_id pointed at the
      // oldest-dated show that carries it (matches the one-time backfill). Best-
      // effort: the primary update already succeeded, so a sync hiccup shouldn't
      // fail the request.
      if (typeof allowed.radio_id === "string" && allowed.radio_id.trim() !== "") {
        const { error: syncError } = await db.rpc("sync_wted_radio_id_show", {
          p_radio_id: allowed.radio_id.trim(),
        })
        if (syncError) console.error("sync_wted_radio_id_show:", syncError.message)
      }
      return { data: true }
    }

    case "setlist_entries_delete": {
      const entry_id = body.entry_id as string | undefined
      if (!entry_id) return { error: "Missing entry_id" }
      const { error } = await db.from("setlist_entries").delete().eq("entry_id", entry_id)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "setlist_entry_guests_select": {
      const setlist_entry_id = body.setlist_entry_id as string | undefined
      if (!setlist_entry_id) return { error: "Missing setlist_entry_id" }
      const { data, error } = await db
        .from("setlist_entry_guests")
        .select("guest_id")
        .eq("setlist_entry_id", setlist_entry_id)
      if (error) return { error: error.message }
      const guest_ids = (data ?? []).map((r: { guest_id: string }) => r.guest_id)
      return { data: { guest_ids } }
    }

    case "setlist_entry_guests_replace": {
      const setlist_entry_id = body.setlist_entry_id as string | undefined
      const guest_ids = body.guest_ids as unknown
      if (!setlist_entry_id || !Array.isArray(guest_ids)) return { error: "Invalid payload" }
      const { error: delErr } = await db
        .from("setlist_entry_guests")
        .delete()
        .eq("setlist_entry_id", setlist_entry_id)
      if (delErr) return { error: delErr.message }
      if (guest_ids.length > 0) {
        const rows = (guest_ids as string[]).map((guest_id) => ({ setlist_entry_id, guest_id }))
        const { error: insErr } = await db.from("setlist_entry_guests").insert(rows)
        if (insErr) return { error: insErr.message }
      }
      return { data: true }
    }

    case "setlist_entry_media_insert": {
      const setlist_entry_id = body.setlist_entry_id as string | undefined
      const release_id = body.release_id as string | undefined
      if (!setlist_entry_id || !release_id) return { error: "Invalid payload" }
      const { error } = await db.from("setlist_entry_media").insert({ setlist_entry_id, release_id })
      if (error) return { error: error.message }
      return { data: true }
    }

    case "setlist_entry_media_delete": {
      const setlist_entry_id = body.setlist_entry_id as string | undefined
      const release_id = body.release_id as string | undefined
      if (!setlist_entry_id || !release_id) return { error: "Invalid payload" }
      const { error } = await db
        .from("setlist_entry_media")
        .delete()
        .eq("setlist_entry_id", setlist_entry_id)
        .eq("release_id", release_id)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "bandcamp_tracks_upsert": {
      const entry_id = body.entry_id as string | undefined
      const track_link = body.track_link as string | undefined
      const track_id = body.track_id as number | undefined
      const album_id = body.album_id as number | undefined
      if (!entry_id || !track_link || track_id == null || album_id == null) {
        return { error: "Invalid payload" }
      }
      const row = {
        entry_id,
        track_link,
        track_id,
        album_id,
        track_title: (body.track_title as string | null) ?? null,
        album_url: (body.album_url as string | null) ?? null,
      }
      const { error } = await db
        .from("bandcamp_tracks")
        .upsert(row, { onConflict: "entry_id,track_id" })
      if (error) return { error: error.message }
      return { data: true }
    }

    case "bandcamp_tracks_delete": {
      const id = body.id as string | undefined
      const entry_id = body.entry_id as string | undefined
      if (!id && !entry_id) return { error: "Missing id or entry_id" }
      let q = db.from("bandcamp_tracks").delete()
      q = id ? q.eq("id", id) : q.eq("entry_id", entry_id as string)
      const { error } = await q
      if (error) return { error: error.message }
      return { data: true }
    }

    case "shows_insert": {
      const row = body.row as Record<string, unknown> | undefined
      if (!row) return { error: "Missing row" }
      const allowed = pick(row, [
        "show_date",
        "show_group",
        "show_tour",
        "show_subvenue",
        "show_iscanon",
        "show_year",
        "show_issetlistgame",
        "show_detail",
      ])
      const { error } = await db.from("shows").insert([allowed])
      if (error) return { error: error.message }
      return { data: true }
    }

    case "shows_update": {
      const show_id = body.show_id as string | undefined
      const patch = body.patch as Record<string, unknown> | undefined
      if (!show_id || !patch) return { error: "Invalid payload" }
      const allowed = pick(patch, [
        "show_date",
        "show_time",
        "show_group",
        "show_tour",
        "show_subvenue",
        "show_iscanon",
        "show_year",
        "show_issetlistgame",
        "show_detail",
        "show_alert",
        "show_coachnotes",
        "show_callbacks",
        "show_wl_link",
        "show_setlistcomplete",
        "discography_display",
        "show_dripfieldcomplete",
        "show_jivecomplete",
        "show_listcategorycomplete",
      ])
      const { error } = await db.from("shows").update(allowed).eq("show_id", show_id)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "venues_insert": {
      const row = body.row as Record<string, unknown> | undefined
      if (!row) return { error: "Missing row" }
      const allowed = pick(row, [
        "venue",
        "venue_location",
        "venue_coachnotes",
        "venue_global",
        "venue_address",
        "venue_latitude",
        "venue_longitude",
      ])
      const { error } = await db.from("venues").insert([allowed])
      if (error) return { error: error.message }
      return { data: true }
    }

    case "venues_update": {
      const match = body.match as Record<string, unknown> | undefined
      const patch = body.patch as Record<string, unknown> | undefined
      if (!match || !patch) return { error: "Invalid payload" }
      const allowed = pick(patch, [
        "venue",
        "venue_location",
        "venue_coachnotes",
        "venue_global",
        "venue_address",
        "venue_latitude",
        "venue_longitude",
      ])
      let q = db.from("venues").update(allowed)
      if (typeof match.venue === "string") q = q.eq("venue", match.venue)
      if (typeof match.venue_location === "string") q = q.eq("venue_location", match.venue_location)
      const { error } = await q
      if (error) return { error: error.message }
      return { data: true }
    }

    case "subvenues_insert": {
      const row = body.row as Record<string, unknown> | undefined
      if (!row) return { error: "Missing row" }
      const allowed = pick(row, [
        "subvenue",
        "subvenue_venue",
        "subvenue_startdate",
        "subvenue_enddate",
      ])
      const { error } = await db.from("subvenues").insert([allowed])
      if (error) return { error: error.message }
      return { data: true }
    }

    case "subvenues_update": {
      const match = body.match as Record<string, unknown> | undefined
      const patch = body.patch as Record<string, unknown> | undefined
      if (!match || !patch || typeof match.subvenue !== "string") {
        return { error: "Invalid payload" }
      }
      const allowed = pick(patch, [
        "subvenue",
        "subvenue_venue",
        "subvenue_startdate",
        "subvenue_enddate",
      ])
      const { error } = await db.from("subvenues").update(allowed).eq("subvenue", match.subvenue)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "guests_insert_new": {
      const guest = body.guest as string | undefined
      const guest_category = body.guest_category as string | undefined
      if (!guest?.trim() || !guest_category?.trim()) return { error: "guest and guest_category required" }
      const { data: highest, error: hErr } = await db
        .from("guests")
        .select("guest_canonid")
        .eq("guest_category", guest_category)
        .order("guest_canonid", { ascending: false })
        .limit(1)
      if (hErr) return { error: hErr.message }
      const nextCanon =
        highest?.length && highest[0].guest_canonid != null
          ? Number(highest[0].guest_canonid) + 1
          : 1
      const ins = {
        guest: guest.trim(),
        guest_displayname: (body.guest_displayname as string | null) || null,
        guest_instrument: (body.guest_instrument as string | null) || null,
        guest_category,
        guest_canonid: nextCanon,
      }
      const { error: iErr } = await db.from("guests").insert(ins)
      if (iErr) return { error: iErr.message }
      return { data: true }
    }

    case "guests_update": {
      const guest_id = body.guest_id as string | undefined
      const patch = body.patch as Record<string, unknown> | undefined
      if (!guest_id || !patch) return { error: "Invalid payload" }
      const allowed = pick(patch, [
        "guest",
        "guest_displayname",
        "guest_instrument",
        "guest_category",
      ])
      const { error } = await db.from("guests").update(allowed).eq("guest_id", guest_id)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "guests_max_canonid": {
      const guest_category = body.guest_category as string | undefined
      if (!guest_category) return { error: "Missing guest_category" }
      const { data: highest, error } = await db
        .from("guests")
        .select("guest_canonid")
        .eq("guest_category", guest_category)
        .order("guest_canonid", { ascending: false })
        .limit(1)
      if (error) return { error: error.message }
      const next =
        highest?.length && highest[0].guest_canonid != null
          ? Number(highest[0].guest_canonid) + 1
          : 1
      return { data: { next_canonid: next } }
    }

    case "guests_insert": {
      const row = body.row as Record<string, unknown> | undefined
      if (!row) return { error: "Missing row" }
      const allowed = pick(row, [
        "guest",
        "guest_displayname",
        "guest_instrument",
        "guest_category",
        "guest_canonid",
      ])
      const { error } = await db.from("guests").insert(allowed)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "songs_insert": {
      const row = body.row as Record<string, unknown> | undefined
      if (!row) return { error: "Missing row" }
      const allowed = pick(row, [
        "song",
        "song_displayname",
        "song_category",
        "song_originalartist",
        "song_categoryorder",
        "song_coachnotes",
      ])
      const { error } = await db.from("songs").insert(allowed)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "songs_update": {
      const song_id = body.song_id as string | undefined
      const patch = body.patch as Record<string, unknown> | undefined
      if (!song_id || !patch) return { error: "Invalid payload" }
      const allowed = pick(patch, [
        "song",
        "song_displayname",
        "song_category",
        "song_originalartist",
        "song_categoryorder",
        "song_coachnotes",
      ])
      const { error } = await db.from("songs").update(allowed).eq("song_id", song_id)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "rpc_add_artist": {
      const artist_name = body.artist_name as string | undefined
      if (!artist_name?.trim()) return { error: "artist_name required" }
      const { error } = await db.rpc("add_artist", { artist_name: artist_name.trim() })
      if (error) return { error: error.message }
      return { data: true }
    }

    case "discography_insert": {
      const row = body.row as Record<string, unknown> | undefined
      if (!row) return { error: "Missing row" }
      const allowed = pick(row, [
        "name",
        "displayname",
        "artist",
        "category",
        "artwork",
        "canon_id",
        "release_date",
        "coach_notes",
      ])
      const { error } = await db.from("discography").insert([allowed])
      if (error) return { error: error.message }
      return { data: true }
    }

    case "discography_update": {
      const uuid = body.uuid as string | undefined
      const patch = body.patch as Record<string, unknown> | undefined
      if (!uuid || !patch) return { error: "Invalid payload" }
      const allowed = pick(patch, [
        "name",
        "displayname",
        "artist",
        "category",
        "artwork",
        "canon_id",
        "release_date",
        "coach_notes",
      ])
      const { error } = await db.from("discography").update(allowed).eq("uuid", uuid)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "discography_delete": {
      const uuid = body.uuid as string | undefined
      if (!uuid) return { error: "Missing uuid" }
      const { error } = await db.from("discography").delete().eq("uuid", uuid)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "show_posters_insert": {
      const row = body.row as Record<string, unknown> | undefined
      if (!row) return { error: "Missing row" }
      const allowed = pick(row, [
        "show",
        "tour",
        "artist",
        "print_run",
        "description",
        "image",
      ])
      const { data, error } = await db.from("show_posters").insert([allowed]).select("uuid").single()
      if (error) return { error: error.message }
      return { data: { uuid: data.uuid } }
    }

    case "show_posters_update": {
      const uuid = body.uuid as string | undefined
      const patch = body.patch as Record<string, unknown> | undefined
      if (!uuid || !patch) return { error: "Invalid payload" }
      const allowed = pick(patch, [
        "show",
        "tour",
        "artist",
        "print_run",
        "description",
        "image",
      ])
      const { error } = await db.from("show_posters").update(allowed).eq("uuid", uuid)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "show_posters_delete": {
      const uuid = body.uuid as string | undefined
      if (!uuid) return { error: "Missing uuid" }
      const { error } = await db.from("show_posters").delete().eq("uuid", uuid)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "discography_entries_insert": {
      const rows = body.rows as unknown
      if (!Array.isArray(rows) || rows.length === 0) return { error: "Invalid rows" }
      const cleaned = rows.map((r: Record<string, unknown>) =>
        pick(r, ["setlist_entry", "discography_entry", "order"]),
      )
      const { error } = await db.from("discography_entries").insert(cleaned)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "discography_entries_update_order": {
      const uuid = body.uuid as string | undefined
      const order = body.order as number | undefined
      if (!uuid || typeof order !== "number" || Number.isNaN(order)) {
        return { error: "Invalid payload" }
      }
      const { error } = await db.from("discography_entries").update({ order }).eq("uuid", uuid)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "discography_entries_delete": {
      const uuid = body.uuid as string | undefined
      if (!uuid) return { error: "Missing uuid" }
      const { error } = await db.from("discography_entries").delete().eq("uuid", uuid)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "releases_insert": {
      const row = body.row as Record<string, unknown> | undefined
      if (!row) return { error: "Missing row" }
      const allowed = pick(row, [
        "release",
        "release_displayname",
        "release_link",
        "release_service",
        "release_artwork",
      ])
      const { error } = await db.from("releases").insert([allowed])
      if (error) return { error: error.message }
      return { data: true }
    }

    case "releases_update": {
      const release_id = body.release_id as string | undefined
      const patch = body.patch as Record<string, unknown> | undefined
      if (!release_id || !patch) return { error: "Invalid payload" }
      const allowed = pick(patch, [
        "release",
        "release_displayname",
        "release_link",
        "release_service",
        "release_artwork",
      ])
      const { error } = await db.from("releases").update(allowed).eq("release_id", release_id)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "releases_delete": {
      const release_id = body.release_id as string | undefined
      if (!release_id) return { error: "Missing release_id" }
      const { error } = await db.from("releases").delete().eq("release_id", release_id)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "releases_shows_insert": {
      const release_id = body.release_id as string | undefined
      const show_id = body.show_id as string | undefined
      const release_order = body.release_order as number | undefined
      if (!release_id || !show_id || release_order == null) return { error: "Invalid payload" }
      const { error } = await db.from("releases_shows").insert({
        release_id,
        show_id,
        release_order,
      })
      if (error) return { error: error.message }
      return { data: true }
    }

    case "releases_shows_update": {
      const release_id = body.release_id as string | undefined
      const show_id = body.show_id as string | undefined
      const release_order = body.release_order as number | undefined
      if (!release_id || !show_id || release_order == null) return { error: "Invalid payload" }
      const { error } = await db
        .from("releases_shows")
        .update({ release_order })
        .eq("release_id", release_id)
        .eq("show_id", show_id)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "releases_shows_delete": {
      const release_id = body.release_id as string | undefined
      const show_id = body.show_id as string | undefined
      if (!release_id || !show_id) return { error: "Invalid payload" }
      const { error } = await db
        .from("releases_shows")
        .delete()
        .eq("release_id", release_id)
        .eq("show_id", show_id)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "show_changes_insert": {
      const row = body.row as Record<string, unknown> | undefined
      if (!row) return { error: "Missing row" }
      const allowed = pick(row, ["show_id", "change_order", "change_type", "change"])
      const { error } = await db.from("show_changes").insert(allowed)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "show_changes_update": {
      const show_change_uuid = body.show_change_uuid as string | undefined
      const patch = body.patch as Record<string, unknown> | undefined
      if (!show_change_uuid || !patch) return { error: "Invalid payload" }
      const allowed = pick(patch, ["change_order", "change_type", "change"])
      const { error } = await db
        .from("show_changes")
        .update(allowed)
        .eq("show_change_uuid", show_change_uuid)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "show_changes_delete": {
      const show_change_uuid = body.show_change_uuid as string | undefined
      if (!show_change_uuid) return { error: "Missing show_change_uuid" }
      const { error } = await db
        .from("show_changes")
        .delete()
        .eq("show_change_uuid", show_change_uuid)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "bugs_list": {
      const { data, error } = await db
        .from("bugs")
        .select(
          "bug_id, bug_type, bug_submissiondate, bug_contactemail, bug_detail, bug_completion, bug_file_url",
        )
        .order("bug_submissiondate", { ascending: false })
      if (error) return { error: error.message }
      return { data: { bugs: data ?? [] } }
    }

    case "bugs_open_count": {
      const { count, error } = await db
        .from("bugs")
        .select("*", { count: "exact", head: true })
        .eq("bug_completion", false)
      if (error) return { error: error.message }
      return { data: { count: count ?? 0 } }
    }

    case "bugs_delete": {
      const bug_id = body.bug_id as string | undefined
      if (!bug_id) return { error: "Missing bug_id" }
      const { error } = await db.from("bugs").delete().eq("bug_id", bug_id)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "wted_episode_entries_update": {
      const ee_uuid = body.ee_uuid as string | undefined
      const patch = body.patch as Record<string, unknown> | undefined
      if (!ee_uuid || !patch) return { error: "Invalid payload" }
      const allowed = pick(patch, ["set", "order", "placement"])
      const { error } = await db.from("wted_episode_entries").update(allowed).eq("uuid", ee_uuid)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "wted_episode_entries_insert": {
      const row = body.row as Record<string, unknown> | undefined
      if (!row) return { error: "Missing row" }
      const allowed = pick(row, ["song", "episode", "set", "order", "placement"])
      const { error } = await db.from("wted_episode_entries").insert(allowed)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "wted_episode_entries_delete": {
      const ee_uuid = body.ee_uuid as string | undefined
      if (!ee_uuid) return { error: "Missing ee_uuid" }
      const { error } = await db.from("wted_episode_entries").delete().eq("uuid", ee_uuid)
      if (error) return { error: error.message }
      return { data: true }
    }

    case "profiles_count": {
      const { count, error } = await db.from("profiles").select("*", { count: "exact", head: true })
      if (error) return { error: error.message }
      return { data: { count: count ?? 0 } }
    }

    /**
     * Admin panel, step 1 of 2: crawl one bounded range of Radio.co Studio pages
     * and insert anything missing. Idempotent — the client loops on `next_page`
     * until `done`, shrinking `page_count` if an invocation hits HTTP 546.
     * Inserts land non-requestable + PENDING; only the reconcile grants access.
     */
    case "wted_radio_ids_studio_crawl": {
      try {
        const startPage = Number(body.start_page ?? 1)
        const pageCount = Number(body.page_count ?? WTED_RADIO_CO_STUDIO_CHUNK_PAGES)
        if (!Number.isInteger(startPage) || startPage < 1) {
          return { error: "`start_page` must be a positive integer" }
        }
        if (!Number.isInteger(pageCount) || pageCount < 1) {
          return { error: "`page_count` must be a positive integer" }
        }

        const cookie = await getRadioCoSessionCookie()
        const chunk = await crawlStudioTracksChunk(cookie, startPage, pageCount)
        const { inserted, artworkUpdated, artworkCleared } =
          await insertStudioTracks(db, chunk.tracks)

        return {
          data: {
            inserted,
            artwork_updated: artworkUpdated,
            artwork_cleared: artworkCleared,
            fetched: chunk.tracks.length,
            total_pages: chunk.totalPages,
            total_items: chunk.totalItems,
            next_page: chunk.nextPage,
            done: chunk.nextPage === null,
          },
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Radio track crawl failed."
        return { error: msg }
      }
    }

    /**
     * Admin panel, step 2 of 2: set `requestable` from the public feed, resolve
     * PENDING rows into NEW/skipped, and mark departures REMOVED. Cheap enough
     * to always run in a single invocation.
     */
    case "wted_radio_ids_sync": {
      try {
        const result = await reconcileWtedRadioIds(db, {
          allowLargeRemoval: body.allow_large_removal === true,
        })
        return { data: result }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Radio track sync failed."
        return { error: msg }
      }
    }

    /** Admin panel: leave NEW list with linked/skipped (client uses anon + Wysteria via `invokeDproAdmin`). */
    case "wted_radio_ids_disposition_new": {
      const uuid = body.uuid as string | undefined
      const status = body.status as string | undefined
      if (!uuid || (status !== "linked" && status !== "skipped")) {
        return { error: "Invalid payload" }
      }
      const { data, error } = await db
        .from("wted_radio_ids")
        .update({ status })
        .eq("uuid", uuid)
        .eq("status", "NEW")
        .select("uuid")
      if (error) return { error: error.message }
      if (!data?.length) return { error: "No matching NEW row." }
      return { data: true }
    }

    /**
     * Admin panel: point a catalog row at a show. `show_id` drives tier-2
     * artwork in wted_radio_ids_catalog (show -> lowest-release_order release
     * -> release_artwork), so assigning one is what gives an otherwise
     * artwork-less track its image. Pass null to clear.
     */
    case "wted_radio_ids_set_show": {
      const uuid = body.uuid as string | undefined
      const rawShowId = body.show_id
      if (!uuid) return { error: "Missing uuid" }
      if (rawShowId !== null && typeof rawShowId !== "string") {
        return { error: "`show_id` must be a uuid string or null" }
      }
      const show_id = rawShowId === null ? null : rawShowId.trim() || null

      const { data, error } = await db
        .from("wted_radio_ids")
        .update({ show_id })
        .eq("uuid", uuid)
        .select("uuid, radio_id, track_artist, track_title, status, artwork, show_id")
      if (error) return { error: error.message }
      if (!data?.length) return { error: "No matching row." }
      return { data: data[0] }
    }

    /** Admin panel: mark REMOVED row skipped (leave REMOVED list). */
    case "wted_radio_ids_skip_removed": {
      const uuid = body.uuid as string | undefined
      if (!uuid) return { error: "Missing uuid" }
      const { data, error } = await db
        .from("wted_radio_ids")
        .update({ status: "skipped" })
        .eq("uuid", uuid)
        .eq("status", "REMOVED")
        .select("uuid")
      if (error) return { error: error.message }
      if (!data?.length) return { error: "No matching REMOVED row." }
      return { data: true }
    }

    case "setlist_discourse_show_event": {
      const show_id = body.show_id as string | undefined
      const event = body.event as string | undefined
      if (!show_id) return { error: "Missing show_id" }
      if (!event || !isSetlistDiscourseShowEvent(event)) {
        return { error: "Invalid event" }
      }
      const { data: show, error: showErr } = await db
        .from("shows")
        .select("show_date, show_venue_location")
        .eq("show_id", show_id)
        .maybeSingle()
      if (showErr) return { error: showErr.message }
      if (!show) return { error: "Show not found" }
      // Record the event so the Live Activity reflects it — a DB trigger
      // (la_on_show_event) pushes the update, or schedules the delayed end for
      // end_show. Non-fatal: a failure here still posts Discourse + the push.
      {
        const { error: evErr } = await db
          .from("setlist_show_events").insert({ show_id, event })
        if (evErr) console.error("setlist_show_events insert:", evErr)
      }
      const message = buildSetlistShowEventDiscourseMessage(
        show_id,
        String(show.show_date ?? ""),
        show.show_venue_location as string | null | undefined,
        event,
      )
      const posted = await postBrainsDiscourseChatMessage(
        BRAINS_DISCOURSE_ONSTAGE_CHANNEL_ID,
        message,
      )
      // Discourse no longer short-circuits: push and Bluesky are independent
      // targets and a Discourse outage shouldn't silence either of them.
      const discourseError = posted.ok ? undefined : posted.error

      let pushResult
      if (posted.ok) {
        const pushPayload = buildSetlistShowEventPushNotification(
          show_id,
          String(show.show_date ?? ""),
          show.show_venue_location as string | null | undefined,
          event,
        )
        try {
          pushResult = await sendSetlistPushNotifications(db, pushPayload)
        } catch (pushErr) {
          console.error("setlist_discourse_show_event push:", pushErr)
          pushResult = {
            attempted: 0,
            sent: 0,
            failed: 0,
            removed: 0,
            skipped: "push send crashed",
          }
        }
      }

      // Repeatable by design — onstage/breaks fire once per set, so each press
      // appends a new reply rather than editing.
      const bluesky = await postSetlistShowEventToBluesky(db, show_id, event)

      // Instagram gets one post per show, at end of show only. Isolated like
      // the Bluesky leg: a failure here can't affect Discourse, push, or Bluesky.
      const instagram =
        event === "end_show" ?
          await postSetlistToInstagram(db, show_id, {
            imageJpegBase64: body.instagram_image_jpeg_base64 as
              | string
              | undefined,
          })
        : undefined

      return {
        data: {
          message,
          channel_id: BRAINS_DISCOURSE_ONSTAGE_CHANNEL_ID,
          event,
          discourse: { posted: posted.ok, skipped: false, error: discourseError },
          push: pushResult,
          bluesky,
          instagram,
        },
      }
    }

    case "setlist_discourse_now_playing": {
      const entry_id = body.entry_id as string | undefined
      if (!entry_id) return { error: "Missing entry_id" }
      const { data: entry, error: entryErr } = await db
        .from("setlist_entries")
        .select(
          "entry_id, entry_show, entry_set, entry_setnum, entry_song, entry_discourse_posted_at",
        )
        .eq("entry_id", entry_id)
        .maybeSingle()
      if (entryErr) return { error: entryErr.message }
      if (!entry) return { error: "Setlist entry not found" }
      const { data: show, error: showErr } = await db
        .from("shows")
        .select("show_date, show_venue_location")
        .eq("show_id", entry.entry_show)
        .maybeSingle()
      if (showErr) return { error: showErr.message }
      if (!show) return { error: "Show not found" }
      const message = buildSetlistNowPlayingDiscourseMessage(
        String(entry.entry_show),
        String(show.show_date ?? ""),
        show.show_venue_location as string | null | undefined,
        entry.entry_set as string | null | undefined,
        Number(entry.entry_setnum),
        entry.entry_song as string | null | undefined,
      )
      // One button, two behaviours. Discourse and push are fire-once — a repeat
      // press (fixing a song, adding coach notes) must not duplicate them.
      // Bluesky always runs and edits its existing post in place.
      const alreadyAnnounced = Boolean(entry.entry_discourse_posted_at)
      let discoursePosted = false
      let discourseError: string | undefined
      let pushResult

      if (!alreadyAnnounced) {
        const posted = await postBrainsDiscourseChatMessage(
          BRAINS_DISCOURSE_ONSTAGE_CHANNEL_ID,
          message,
        )
        discoursePosted = posted.ok
        discourseError = posted.ok ? undefined : posted.error

        if (posted.ok) {
          // Stamped only on success, so a failed send is retried by pressing again.
          const { error: stampErr } = await db
            .from("setlist_entries")
            .update({ entry_discourse_posted_at: new Date().toISOString() })
            .eq("entry_id", entry_id)
          if (stampErr) {
            console.error("entry_discourse_posted_at stamp:", stampErr.message)
          }

          const nowPlayingArtwork = await resolveSongCategoryArtwork(
            db,
            entry.entry_song as string | null | undefined,
          )
          const pushPayload = buildSetlistNowPlayingPushNotification(
            String(entry.entry_show),
            String(show.show_date ?? ""),
            show.show_venue_location as string | null | undefined,
            entry.entry_set as string | null | undefined,
            Number(entry.entry_setnum),
            entry.entry_song as string | null | undefined,
            nowPlayingArtwork,
          )
          try {
            pushResult = await sendSetlistPushNotifications(db, pushPayload)
          } catch (pushErr) {
            console.error("setlist_discourse_now_playing push:", pushErr)
            pushResult = {
              attempted: 0,
              sent: 0,
              failed: 0,
              removed: 0,
              skipped: "push send crashed",
            }
          }
        }
      }

      const bluesky = await postSetlistSongToBluesky(db, entry_id, {
        songImageJpegBase64: body.song_image_jpeg_base64 as string | undefined,
      })

      return {
        data: {
          message,
          channel_id: BRAINS_DISCOURSE_ONSTAGE_CHANNEL_ID,
          entry_id,
          discourse: {
            posted: discoursePosted,
            skipped: alreadyAnnounced,
            error: discourseError,
          },
          push: pushResult,
          bluesky,
        },
      }
    }

    case "setlist_game_score_show": {
      const show_id = body.show_id as string | undefined
      if (!show_id) return { error: "Missing show_id" }
      const scored = await scoreSetlistGameShow(db, show_id)
      if (scored.error) return { error: scored.error }
      return { data: true }
    }

    default:
      return { error: `Unknown action: ${action}` }
  }
}

function bearerToken(h: string | null): string | null {
  if (!h?.startsWith("Bearer ")) return null
  const t = h.slice(7).trim()
  return t !== "" ? t : null
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return httpErr("Method not allowed", 405)

  /** Wysteria SSO JWT only — never verify the anon Supabase JWT in `Authorization`. */
  const token = bearerToken(req.headers.get("x-wysteria-authorization"))
  if (!token) return httpErr("Missing Wysteria session", 401)

  const jwtSecret = Deno.env.get("WYSTERIA_JWT_SECRET")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!jwtSecret || !supabaseUrl || !supabaseServiceKey) {
    return httpErr("Server configuration error", 500)
  }

  let jwtPayload: Record<string, unknown>
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret))
    jwtPayload = payload as Record<string, unknown>
  } catch {
    return httpErr("Invalid or expired Wysteria session", 401)
  }

  if (jwtPayload.is_admin !== true) return httpErr("Forbidden", 403)

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    return httpErr("Invalid request body", 400)
  }

  const action = body.action as string | undefined
  if (!action) return httpErr("Missing action", 400)

  const db = createClient(supabaseUrl, supabaseServiceKey)
  const result = await handleAction(db, action, body)
  if (result.error) {
    return jsonOk({ error: result.error })
  }
  return jsonOk({ data: result.data })
})
